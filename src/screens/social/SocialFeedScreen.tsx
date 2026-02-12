import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView, Animated, TouchableWithoutFeedback, Dimensions, Keyboard, Platform, Alert, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvents, Event } from '@/context/EventsContext';
import { PlaceAutocomplete } from '@/components/ui/PlaceAutocomplete';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRevenueCat } from '@/context/RevenueCatContext';

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function minDistanceToRoute(eventLat: number, eventLng: number, route: any[]): number {
    if (!route || route.length === 0) return Infinity;
    let min = Infinity;
    for (const cp of route) {
        const d = haversineKm(eventLat, eventLng, cp.lat, cp.lng);
        if (d < min) min = d;
    }
    return min;
}

const TABS = ['People', 'Events', 'Builders'];
const TAGS = [
    { name: 'Sport', icon: 'football-outline' },
    { name: 'Art', icon: 'color-palette-outline' },
    { name: 'Tech', icon: 'hardware-chip-outline' },
    { name: 'Music', icon: 'musical-notes-outline' }
];

const BUILDER_TAGS = [
    { name: 'Plumbing', icon: 'water-outline' },
    { name: 'Electrical', icon: 'flash-outline' },
    { name: 'Woodwork', icon: 'construct-outline' },
    { name: 'Solar', icon: 'sunny-outline' },
    { name: 'Carpentry', icon: 'hammer-outline' },
    { name: 'Metalwork', icon: 'settings-outline' },
    { name: 'Mechanic', icon: 'car-outline' },
    { name: 'Insulation', icon: 'home-outline' },
];

// Placeholder illustration for events where no specific image is provided
const DEFAULT_ILLUSTRATION = 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

export default function SocialFeedScreen() {
    const insets = useSafeAreaInsets();
    const { allEvents, joinEvent, leaveEvent, createEvent, updateEvent, deleteEvent } = useEvents(); // Added updateEvent, deleteEvent
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [activeTab, setActiveTab] = useState('Events');
    const [peopleData, setPeopleData] = useState<any[]>([]);
    const [builderData, setBuilderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [messagingLoading, setMessagingLoading] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { isPro } = useRevenueCat();
    const { width } = Dimensions.get('window');

    // Helper to get chat ID for an event
    const getEventChatId = async (eventId: string) => {
        const { data } = await supabase
            .from('chats')
            .select('id')
            .eq('type', `event_${eventId}`)
            .single();
        return data?.id;
    };

    // Per-tab filter state
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [eventCategories, setEventCategories] = useState<string[]>([]);
    const [peopleCategories, setPeopleCategories] = useState<string[]>([]);
    const [builderCategories, setBuilderCategories] = useState<string[]>([]);

    // Checkpoint picker state
    const [selectedCheckpointIndex, setSelectedCheckpointIndex] = useState(0);
    const [checkpointPickerVisible, setCheckpointPickerVisible] = useState(false);

    // Computed per-tab filter helpers
    const selectedCategories = activeTab === 'Events' ? eventCategories : activeTab === 'People' ? peopleCategories : builderCategories;
    const setSelectedCategories = activeTab === 'Events' ? setEventCategories : activeTab === 'People' ? setPeopleCategories : setBuilderCategories;

    const [userRoute, setUserRoute] = useState<any[]>([]);

    // Reference point from user route for distance calculations
    const referencePoint = useMemo(() => {
        if (userRoute.length === 0) return null;
        const idx = Math.min(selectedCheckpointIndex, userRoute.length - 1);
        return userRoute[idx];
    }, [userRoute, selectedCheckpointIndex]);

    // Add/Edit Event State
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newEventDate, setNewEventDate] = useState<Date>(new Date()); // Used for date/time pickers
    const [newEventDateSet, setNewEventDateSet] = useState(false); // whether user has picked
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [newLoc, setNewLoc] = useState('');
    const [newEventLocationCoords, setNewEventLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [newCategory, setNewCategory] = useState('Sport'); // Default

    // Load user route on mount for proximity sorting
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('profiles').select('route_data').eq('id', user.id).single();
            if (data?.route_data && Array.isArray(data.route_data)) {
                setUserRoute(data.route_data as any[]);
            }
        })();
    }, []);

    useEffect(() => {
        // Handle navigation params
        if (route.params?.activeTab) {
            setActiveTab(route.params.activeTab);
        }
        if (route.params?.category) {
            // Scope category param to the target tab only
            const tab = route.params?.activeTab || 'Events';
            if (tab === 'Events') setEventCategories([route.params.category]);
            else if (tab === 'People') setPeopleCategories([route.params.category]);
            else if (tab === 'Builders') setBuilderCategories([route.params.category]);
        }
    }, [route.params]);

    useEffect(() => {
        // Fetch other non-event data if needed
        if (activeTab === 'People') {
            fetchPeopleActivities();
        } else if (activeTab === 'Builders') {
            fetchBuilders();
        }
    }, [activeTab]);

    async function fetchPeopleActivities() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            const { data, error } = await supabase
                .from('daily_activities')
                .select('*, profiles(*)');

            if (error) throw error;
            // Filter out the current user
            const filtered = (data || []).filter(item => item.user_id !== user?.id);
            setPeopleData(filtered);
        } catch (error) {
            console.error('Error fetching people activities:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchBuilders() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            const { data, error } = await supabase
                .from('builder_profiles')
                .select('*, profiles!builder_profiles_id_fkey(full_name, avatar_url, username, route_data)')
                .eq('is_active', true);

            if (error) throw error;
            // Filter out the current user
            const filtered = (data || []).filter(item => item.id !== user?.id);
            setBuilderData(filtered);
        } catch (error) {
            console.error('Error fetching builders:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleStartChat = async (targetUser: any) => {
        try {
            setMessagingLoading(targetUser.id);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'Please log in to message.');
                return;
            }

            if (user.id === targetUser.id) {
                Alert.alert('Error', "You can't message yourself!");
                return;
            }

            // Use RPC to create or find existing social chat
            const { data: chatId, error } = await supabase.rpc('create_social_chat', {
                p_user_id: user.id,
                p_target_user_id: targetUser.id,
            });

            if (error) throw error;

            if (chatId) {
                // Navigate to Chat tab with Social sub-tab, then to the chat
                navigation.navigate('HomeTabs', {
                    screen: 'Chat',
                    params: { initialTab: 'social' }
                });
                // Small delay to let the tab switch, then navigate to chat detail
                setTimeout(() => {
                    navigation.navigate('ChatDetail', {
                        chatId: chatId,
                        otherUserName: targetUser.full_name || targetUser.username || 'User'
                    });
                }, 100);
            }

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setMessagingLoading(null);
        }
    };

    const handleStartBuilderChat = async (builder: any) => {
        try {
            setMessagingLoading(builder.id);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'Please log in to message.');
                return;
            }

            if (user.id === builder.id) {
                Alert.alert('Error', "You can't message yourself!");
                return;
            }

            // Use existing RPC to create or find builder chat
            const { data: chatId, error } = await supabase.rpc('create_builder_chat', {
                p_builder_id: builder.id,
                p_user_id: user.id,
            });

            if (error) throw error;

            if (chatId) {
                // Navigate to Chat tab with Builders sub-tab, then to the chat
                navigation.navigate('HomeTabs', {
                    screen: 'Chat',
                    params: { initialTab: 'builder' }
                });
                setTimeout(() => {
                    navigation.navigate('ChatDetail', {
                        chatId: chatId,
                        otherUserName: builder.business_name || builder.profiles?.full_name || 'Builder'
                    });
                }, 100);
            }

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setMessagingLoading(null);
        }
    };

    const getFilteredData = () => {
        let currentData: any[] = [];

        if (activeTab === 'Events') {
            currentData = allEvents;
        } else if (activeTab === 'People') {
            currentData = peopleData;
        } else if (activeTab === 'Builders') {
            currentData = builderData;
        }

        // Filter by Search
        if (searchText) {
            const lower = searchText.toLowerCase();
            currentData = currentData.filter(item =>
                (item.title || item.name || item.business_name || '').toLowerCase().includes(lower) ||
                (item.description || item.bio || item.content || '').toLowerCase().includes(lower) ||
                (item.profiles?.full_name || '').toLowerCase().includes(lower)
            );
        }

        // Filter by Category (uses per-tab state)
        if (selectedCategories.length > 0) {
            if (activeTab === 'Events') {
                currentData = currentData.filter(item => selectedCategories.includes(item.category));
            } else if (activeTab === 'People') {
                currentData = currentData.filter(item => selectedCategories.includes(item.category));
            } else if (activeTab === 'Builders') {
                currentData = currentData.filter(item =>
                    item.expertise?.some((ex: string) => selectedCategories.includes(ex))
                );
            }
        }

        // Sort ALL tabs by proximity
        if (referencePoint) {
            if (activeTab === 'Events') {
                currentData = currentData.map((ev: Event) => {
                    if (ev.latitude != null && ev.longitude != null) {
                        return { ...ev, distanceKm: haversineKm(referencePoint.lat, referencePoint.lng, ev.latitude, ev.longitude) };
                    }
                    return { ...ev, distanceKm: Infinity };
                });
            } else if (activeTab === 'People') {
                currentData = currentData.map((item: any) => {
                    const profile = item.profiles;
                    const pRoute = profile?.route_data;
                    if (pRoute && Array.isArray(pRoute) && pRoute.length > 0) {
                        const firstCp = pRoute[0];
                        return { ...item, distanceKm: haversineKm(referencePoint.lat, referencePoint.lng, firstCp.lat, firstCp.lng) };
                    }
                    return { ...item, distanceKm: Infinity };
                });
            } else if (activeTab === 'Builders') {
                currentData = currentData.map((item: any) => {
                    const pRoute = item.profiles?.route_data;
                    if (pRoute && Array.isArray(pRoute) && pRoute.length > 0) {
                        const firstCp = pRoute[0];
                        return { ...item, distanceKm: haversineKm(referencePoint.lat, referencePoint.lng, firstCp.lat, firstCp.lng) };
                    }
                    return { ...item, distanceKm: Infinity };
                });
            }
            currentData.sort((a: any, b: any) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        }

        return currentData;
    };

    const resetEventForm = () => {
        setNewTitle('');
        setNewDesc('');
        setNewEventDate(new Date());
        setNewEventDateSet(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
        setNewLoc('');
        setNewEventLocationCoords(null);
        setNewCategory('Sport');
    };

    const handleOpenCreate = () => {
        setIsEditing(false);
        setEditingEventId(null);
        resetEventForm();
        setModalVisible(true);
    };

    const handleOpenEdit = (event: Event) => {
        setIsEditing(true);
        setEditingEventId(event.id);
        setNewTitle(event.title);
        setNewDesc(event.description);
        // For editing, try to parse existing time string into Date object
        const parsedDate = event.startDate || (event.time ? new Date(event.time) : new Date());
        setNewEventDate(parsedDate);
        setNewEventDateSet(!!event.startDate || !!event.time);
        setNewLoc(event.location || '');
        if (event.latitude && event.longitude) {
            setNewEventLocationCoords({ lat: event.latitude, lng: event.longitude });
        } else {
            setNewEventLocationCoords(null);
        }
        setNewCategory(event.category || 'Sport');
        setModalVisible(true);
    };

    const handleCreateEvent = async () => {
        if (!newTitle || !newCategory) {
            Alert.alert('Missing Fields', 'Please fill in at least the title and category.');
            return;
        }

        const eventData: Event = {
            id: isEditing && editingEventId ? editingEventId : Date.now().toString(), // ID ignored on create
            title: newTitle,
            description: newDesc,
            time: newEventDateSet ? formatPickedDateTime(newEventDate) : 'TBD',
            location: newLoc || 'TBD',
            category: newCategory,
            image_url: DEFAULT_ILLUSTRATION,
            isCustom: true,
            joined: true, // Creator automatically joins
            latitude: newEventLocationCoords?.lat,
            longitude: newEventLocationCoords?.lng,
            startDate: newEventDateSet ? newEventDate : undefined,
        };

        if (isEditing && editingEventId) {
            await updateEvent(eventData);
        } else {
            await createEvent(eventData);
        }

        setModalVisible(false);
        resetEventForm();
    };

    const handleDelete = (eventId: string) => {
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteEvent(eventId) }
            ]
        );
    };

    const handleChatPress = async (event: Event) => {
        try {
            // @ts-ignore
            const { data: chatId, error } = await supabase.rpc('get_or_create_event_chat', {
                _event_id: event.id,
                _event_name: event.title
            });

            if (error) throw error;

            if (chatId) {
                navigation.navigate('HomeTabs', {
                    screen: 'Chat',
                    params: { initialTab: 'events' }
                });
                setTimeout(() => {
                    navigation.navigate('ChatDetail', { chatId, otherUserName: event.title });
                }, 100);
            } else {
                Alert.alert('Error', 'Could not initialize chat (No ID returned).');
            }
        } catch (err) {
            console.error("Error opening chat:", err);
            Alert.alert('Error', 'Failed to open chat.');
        }
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(false);
        if (selectedDate) {
            // preserve the time already picked
            const updated = new Date(newEventDate);
            updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
            setNewEventDate(updated);
            setNewEventDateSet(true);
        }
    };

    const onTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selectedDate) {
            const updated = new Date(newEventDate);
            updated.setHours(selectedDate.getHours(), selectedDate.getMinutes());
            setNewEventDate(updated);
            setNewEventDateSet(true);
        }
    };

    const formatPickedDateTime = (d: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        let hours = d.getHours();
        const mins = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${month} ${day}, ${year} at ${hours}:${mins} ${ampm}`;
    };

    const toggleFilterCategory = (catName: string) => {
        if (selectedCategories.includes(catName)) {
            setSelectedCategories(selectedCategories.filter(c => c !== catName));
        } else {
            setSelectedCategories([...selectedCategories, catName]);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'Events') {
            const eventItem = item as Event;
            return (
                <View style={styles.eventCard}>
                    <ExpoImage source={require('@/assets/images/activity.jpg')} style={styles.eventImage} />
                    <View style={styles.eventContent}>
                        <View style={styles.titleRow}>
                            <Text style={styles.eventTitle}>{eventItem.title}</Text>
                            {eventItem.category && (
                                <View style={styles.categoryBadgeSmall}>
                                    <Text style={styles.categoryBadgeTextSmall}>{eventItem.category}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.eventDesc} numberOfLines={2}>{eventItem.description}</Text>

                        {eventItem.distanceKm != null && eventItem.distanceKm < 100 && (
                            <View style={styles.onRouteBadge}>
                                <Ionicons name="navigate" size={12} color="white" />
                                <Text style={styles.onRouteBadgeText}>
                                    {eventItem.distanceKm < 1 ? 'On Your Route' : `${Math.round(eventItem.distanceKm)} km from route`}
                                </Text>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={16} color="#5B7FFF" />
                            <Text style={styles.infoText}>{eventItem.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color="#5B7FFF" />
                            <Text style={styles.infoText}>{eventItem.location}</Text>
                        </View>

                        <View style={styles.actionButtons}>
                            {/* Chat Button for Joined Events */}
                            {eventItem.joined && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#E8F1FF', marginRight: 8 }]}
                                    onPress={() => handleChatPress(eventItem)}
                                >
                                    <Ionicons name="chatbubbles-outline" size={18} color="#4d73ba" />
                                    <Text style={[styles.actionBtnText, { color: '#4d73ba' }]}>Chat</Text>
                                </TouchableOpacity>
                            )}

                            {/* Join/Leave Button */}
                            {/* Join/Leave Button */}
                            <TouchableOpacity
                                style={[styles.actionBtn, eventItem.joined ? styles.joinedActionButton : styles.joinActionButton, { marginLeft: 'auto' }]}
                                onPress={() => eventItem.joined ? leaveEvent(eventItem.id) : joinEvent(eventItem.id)}
                            >
                                {eventItem.joined ? (
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#888" />
                                ) : (
                                    <Ionicons name="add-circle-outline" size={18} color="white" />
                                )}
                                <Text style={[styles.actionBtnText, eventItem.joined ? styles.joinedButtonText : { color: 'white' }]}>
                                    {eventItem.joined ? 'Going' : 'Join'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Edit/Delete Controls for Creator */}
                        {eventItem.isCustom && (
                            <View style={styles.creatorControls}>
                                <TouchableOpacity onPress={() => handleOpenEdit(eventItem)} style={styles.controlBtn}>
                                    <Ionicons name="create-outline" size={20} color="#666" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(eventItem.id)} style={styles.controlBtn}>
                                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        if (activeTab === 'People') {
            const activity = item;
            const profile = activity.profiles;
            return (
                <View style={styles.personCard}>
                    <View style={styles.personHeader}>
                        <ExpoImage
                            source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
                            style={styles.personAvatar}
                        />
                        <View style={styles.personInfo}>
                            <Text style={styles.personName}>{profile?.full_name || 'User'}</Text>
                            <View style={styles.categoryBadgeSmall}>
                                <Text style={styles.categoryBadgeTextSmall}>{activity.category}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.messageIconBtn}
                            onPress={() => handleStartChat(profile)}
                            disabled={messagingLoading === profile?.id}
                        >
                            {messagingLoading === profile?.id ? (
                                <ActivityIndicator size="small" color="#4d73ba" />
                            ) : (
                                <Ionicons name="chatbubble-ellipses" size={24} color="#4d73ba" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {item.distanceKm != null && item.distanceKm < Infinity && (
                        <View style={styles.onRouteBadge}>
                            <Ionicons name="navigate" size={12} color="white" />
                            <Text style={styles.onRouteBadgeText}>
                                {item.distanceKm < 1 ? 'Nearby' : `${Math.round(item.distanceKm)} km away`}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.activityContent}>"{activity.content}"</Text>
                </View>
            );
        }

        if (activeTab === 'Builders') {
            const builderProfile = item.profiles;
            return (
                <View style={styles.personCard}>
                    <View style={styles.personHeader}>
                        <ExpoImage
                            source={{ uri: builderProfile?.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
                            style={styles.personAvatar}
                        />
                        <View style={styles.personInfo}>
                            <Text style={styles.personName}>{item.business_name || builderProfile?.full_name || 'Builder'}</Text>
                            <Text style={styles.builderRate}>${item.hourly_rate}/hr</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.messageIconBtn}
                            onPress={() => handleStartBuilderChat(item)}
                            disabled={messagingLoading === item.id}
                        >
                            {messagingLoading === item.id ? (
                                <ActivityIndicator size="small" color="#4d73ba" />
                            ) : (
                                <Ionicons name="chatbubble-ellipses" size={24} color="#4d73ba" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <View style={styles.builderChips}>
                        {item.expertise?.slice(0, 4).map((ex: string) => (
                            <View key={ex} style={styles.builderChip}>
                                <Text style={styles.builderChipText}>{ex}</Text>
                            </View>
                        ))}
                    </View>
                    {item.distanceKm != null && item.distanceKm < Infinity && (
                        <View style={styles.onRouteBadge}>
                            <Ionicons name="navigate" size={12} color="white" />
                            <Text style={styles.onRouteBadgeText}>
                                {item.distanceKm < 1 ? 'Nearby' : `${Math.round(item.distanceKm)} km away`}
                            </Text>
                        </View>
                    )}
                    {item.bio ? <Text style={styles.activityContent} numberOfLines={2}>{item.bio}</Text> : null}
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <ExpoImage
                source={require('@/assets/images/image.jpg')}
                style={styles.backgroundImage}
                contentFit="cover"
                contentPosition="center"
            />
            <View style={{ paddingTop: insets.top, flex: 1 }}>
                {/* Header Area */}
                <View style={styles.headerArea}>
                    <View style={styles.headerTop}>
                        <Text style={styles.screenTitle}>Discover</Text>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsRow}>
                        {TABS.map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => {
                                    setActiveTab(tab);
                                    setSearchText('');
                                }}
                            >
                                <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : styles.inactiveTabText]}>
                                    {tab}
                                </Text>
                                {activeTab === tab && <View style={styles.activeLine} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentContainer}>
                    {/* Checkpoint Picker */}
                    {userRoute.length > 0 && (
                        <TouchableOpacity
                            style={styles.checkpointBar}
                            onPress={() => {
                                if (!isPro) {
                                    Alert.alert(
                                        'Pro Feature',
                                        'Upgrade to Pro to search from different checkpoints on your route!',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
                                        ]
                                    );
                                } else {
                                    setCheckpointPickerVisible(true);
                                }
                            }}
                        >
                            <Ionicons name="location" size={16} color="#5B7FFF" />
                            <Text style={styles.checkpointBarText}>
                                Sorting from: {userRoute[Math.min(selectedCheckpointIndex, userRoute.length - 1)]?.name || `Checkpoint ${selectedCheckpointIndex + 1}`}
                            </Text>
                            {isPro ? (
                                <Ionicons name="chevron-down" size={16} color="#5B7FFF" />
                            ) : (
                                <View style={styles.proBadge}>
                                    <Text style={styles.proBadgeText}>PRO</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                    {/* Search & Filter */}
                    <View style={styles.searchRow}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Find groups and events..."
                                placeholderTextColor="#999"
                                style={styles.input}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
                            <Ionicons name="options-outline" size={24} color="#999" />
                        </TouchableOpacity>
                    </View>

                    {/* Selected Filters / 'All' Display */}
                    <View style={styles.tagsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                            {selectedCategories.length === 0 ? (
                                <View style={styles.tagBadge}>
                                    <Ionicons name="layers-outline" size={16} color="white" style={{ marginRight: 6 }} />
                                    <Text style={styles.tagText}>All</Text>
                                </View>
                            ) : (
                                selectedCategories.map((cat, index) => {
                                    const tagInfo = TAGS.find(t => t.name === cat);
                                    return (
                                        <View key={index} style={styles.tagBadge}>
                                            <Ionicons name={(tagInfo?.icon || 'pricetag-outline') as any} size={16} color="white" style={{ marginRight: 6 }} />
                                            <Text style={styles.tagText}>{cat}</Text>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>

                    {/* List */}
                    <FlatList
                        data={getFilteredData()}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>

            {/* Floating Action Button */}
            {activeTab === 'Events' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: 20 }]}
                    onPress={handleOpenCreate}
                >
                    <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>
            )}
            {activeTab === 'Builders' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: 20 }]}
                    onPress={() => navigation.navigate('BuilderRegistration' as any)}
                >
                    <Ionicons name="construct" size={28} color="white" />
                </TouchableOpacity>
            )}

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Filter Categories</Text>
                                <View style={styles.categoriesGrid}>
                                    {(activeTab === 'Builders' ? BUILDER_TAGS : TAGS).map(tag => (
                                        <TouchableOpacity
                                            key={tag.name}
                                            style={[
                                                styles.categoryOption,
                                                selectedCategories.includes(tag.name) && styles.categoryOptionSelected
                                            ]}
                                            onPress={() => toggleFilterCategory(tag.name)}
                                        >
                                            <Ionicons
                                                name={tag.icon as any}
                                                size={24}
                                                color={selectedCategories.includes(tag.name) ? 'white' : '#5B7FFF'}
                                            />
                                            <Text style={[
                                                styles.categoryOptionText,
                                                selectedCategories.includes(tag.name) && styles.categoryOptionTextSelected
                                            ]}>
                                                {tag.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity style={styles.modalButton} onPress={() => setFilterModalVisible(false)}>
                                    <Text style={styles.modalButtonText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Create/Edit Event Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isEditing ? 'Edit Event' : 'Add New Event'}</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); resetEventForm(); }}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ maxHeight: 400 }}
                            contentContainerStyle={{ paddingBottom: 200 }}
                            keyboardShouldPersistTaps="handled"
                            scrollEnabled={true}
                        >
                            <Text style={styles.inputLabel}>Title</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Event Name"
                                value={newTitle}
                                onChangeText={setNewTitle}
                            />

                            <Text style={styles.inputLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                                {TAGS.map(tag => (
                                    <TouchableOpacity
                                        key={tag.name}
                                        style={[
                                            styles.categoryChip,
                                            newCategory === tag.name && styles.categoryChipSelected
                                        ]}
                                        onPress={() => setNewCategory(tag.name)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            newCategory === tag.name && styles.categoryChipTextSelected
                                        ]}>{tag.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                placeholder="What's happening?"
                                multiline
                                numberOfLines={3}
                                value={newDesc}
                                onChangeText={setNewDesc}
                            />

                            <Text style={styles.inputLabel}>Date & Time</Text>
                            <View style={styles.dateTimeRow}>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={18} color="#5B7FFF" />
                                    <Text style={styles.datePickerButtonText}>
                                        {newEventDateSet
                                            ? `${newEventDate.toLocaleDateString()}`
                                            : 'Pick Date'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={18} color="#5B7FFF" />
                                    <Text style={styles.datePickerButtonText}>
                                        {newEventDateSet
                                            ? `${newEventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            : 'Pick Time'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={newEventDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                            {showTimePicker && (
                                <DateTimePicker
                                    value={newEventDate}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onTimeChange}
                                />
                            )}
                            {newEventDateSet && (
                                <View style={styles.selectedDateBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                                    <Text style={styles.selectedDateText}>{formatPickedDateTime(newEventDate)}</Text>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Location</Text>
                            <View style={{ zIndex: 1000 }}>
                                <PlaceAutocomplete
                                    onSelect={(place) => {
                                        setNewLoc(place.name);
                                        setNewEventLocationCoords({ lat: place.lat, lng: place.lng });
                                    }}
                                    placeholder="Search for a location..."
                                    initialValue={newLoc}
                                />
                            </View>
                            {newLoc ? (
                                <View style={styles.selectedLocationBadge}>
                                    <Ionicons name="location" size={16} color="#5B7FFF" />
                                    <Text style={styles.selectedLocationText}>{newLoc}</Text>
                                </View>
                            ) : null}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    resetEventForm();
                                }}
                            >
                                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handleCreateEvent}>
                                <Text style={styles.modalButtonText}>{isEditing ? 'Save Changes' : 'Create Event'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Checkpoint Picker Modal */}
            <Modal
                visible={checkpointPickerVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCheckpointPickerVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setCheckpointPickerVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Search From Checkpoint</Text>
                                <ScrollView style={{ maxHeight: 300 }}>
                                    {userRoute.map((cp: any, idx: number) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.checkpointOption,
                                                selectedCheckpointIndex === idx && styles.checkpointOptionSelected
                                            ]}
                                            onPress={() => {
                                                setSelectedCheckpointIndex(idx);
                                                setCheckpointPickerVisible(false);
                                            }}
                                        >
                                            <Ionicons
                                                name={selectedCheckpointIndex === idx ? 'radio-button-on' : 'radio-button-off'}
                                                size={20}
                                                color={selectedCheckpointIndex === idx ? '#5B7FFF' : '#999'}
                                            />
                                            <Text style={[
                                                styles.checkpointOptionText,
                                                selectedCheckpointIndex === idx && styles.checkpointOptionTextSelected
                                            ]}>
                                                {cp.name || `Checkpoint ${idx + 1}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    backgroundImage: {
        position: 'absolute',
        top: -85,
        left: 0,
        right: 0,
        bottom: 130,
    },
    headerArea: {
        paddingHorizontal: 20,
        paddingBottom: 0,
        paddingTop: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
        marginBottom: 10,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 30,
        paddingLeft: 5,
        marginBottom: -3,
        zIndex: 10,
    },
    tab: {
        paddingBottom: 15,
        position: 'relative',
    },
    activeTab: {},
    tabText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    activeTabText: {
        color: 'white',
    },
    activeLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#5B7FFF',
        borderRadius: 2,
    },
    personCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    personHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    personAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    messageIconBtn: {
        padding: 8,
    },
    activityContent: {
        fontSize: 16,
        color: '#444',
        fontStyle: 'italic',
        lineHeight: 24,
        marginBottom: 20,
    },
    personMessageBtn: {
        backgroundColor: '#4d73ba',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    personMessageBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 25,
        overflow: 'hidden',
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 46,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    filterBtn: {
        padding: 5,
    },
    tagsContainer: {
        marginBottom: 20,
        height: 32,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4d73ba',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    tagText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },
    inactiveTabText: {
        color: '#d3d3d3ff',
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f8f8f8',
    },
    eventImage: {
        width: 110,
        height: 150,
        borderRadius: 12,
        backgroundColor: '#ddd',
    },
    eventContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        flex: 1,
    },
    categoryBadgeSmall: {
        backgroundColor: '#F0F0F8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    categoryBadgeTextSmall: {
        fontSize: 10,
        color: '#5B7FFF',
        fontWeight: 'bold',
    },
    eventDesc: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 12,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    joinActionButton: {
        backgroundColor: '#5B7FFF',
        marginTop: 0,
        paddingHorizontal: 20,
    },
    joinedActionButton: {
        backgroundColor: '#F0F0F0',
        marginTop: 0,
        paddingHorizontal: 20,
    },
    joinedButton: {
        backgroundColor: '#E0E0E0',
    },
    joinButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    joinedButtonText: {
        color: '#888',
    },
    simpleCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardSubtitle: { color: '#666', marginVertical: 4 },
    cardDesc: { color: '#444' },
    builderRate: {
        fontSize: 14,
        color: '#34C759',
        fontWeight: '600',
        marginTop: 2,
    },
    builderChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        gap: 6,
    },
    builderChip: {
        backgroundColor: '#F0F4FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    builderChipText: {
        fontSize: 12,
        color: '#5B7FFF',
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#5B7FFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 13
    },
    creatorControls: {
        position: 'absolute',
        top: 15,
        right: 15,
        flexDirection: 'row',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 5,
        borderRadius: 15
    },
    controlBtn: {
        padding: 5,
        marginHorizontal: 2
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 20,
    },
    categoryOption: {
        width: '45%',
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#F5F5FA',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryOptionSelected: {
        backgroundColor: '#5B7FFF',
        borderColor: '#5B7FFF',
    },
    categoryOptionText: {
        marginTop: 8,
        fontWeight: '600',
        color: '#5B7FFF',
    },
    categoryOptionTextSelected: {
        color: 'white',
    },
    modalButton: {
        backgroundColor: '#5B7FFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        flex: 1,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 10,
    },
    modalInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    categorySelector: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryChipSelected: {
        backgroundColor: '#5B7FFF',
        borderColor: '#5B7FFF',
    },
    categoryChipText: {
        color: '#666',
        fontWeight: '600',
    },
    categoryChipTextSelected: {
        color: 'white',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        justifyContent: 'space-between',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
        flex: 1,
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    onRouteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#34C759',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 6,
        gap: 4,
    },
    onRouteBadgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    selectedLocationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 8,
        gap: 8,
    },
    selectedLocationText: {
        color: '#5B7FFF',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    datePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: '#D6E0FF',
    },
    datePickerButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    selectedDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F9EE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 8,
        gap: 8,
    },
    selectedDateText: {
        color: '#2D8E50',
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    checkpointBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        marginHorizontal: 20,
        marginBottom: 15,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#D6E0FF',
    },
    checkpointBarText: {
        flex: 1,
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    proBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    proBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
    },
    checkpointOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    checkpointOptionSelected: {
        backgroundColor: '#F0F4FF',
    },
    checkpointOptionText: {
        fontSize: 15,
        color: '#333',
    },
    checkpointOptionTextSelected: {
        color: '#5B7FFF',
        fontWeight: '600',
    },
}); 