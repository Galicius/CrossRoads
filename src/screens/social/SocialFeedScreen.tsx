import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, TouchableWithoutFeedback, Keyboard, Platform, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvents, Event } from '@/context/EventsContext';
import { PlaceAutocomplete } from '@/components/ui/PlaceAutocomplete';
import { supabase } from '@/lib/supabase';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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

// Placeholder illustration for events where no specific image is provided
const DEFAULT_ILLUSTRATION = 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

export default function SocialFeedScreen() {
    const insets = useSafeAreaInsets();
    const { allEvents, createEvent, joinEvent } = useEvents();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [activeTab, setActiveTab] = useState('Events');
    const [peopleData, setPeopleData] = useState<any[]>([]);
    const [builderData, setBuilderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [messagingLoading, setMessagingLoading] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');

    // Filter State
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Add Event State
    const [addEventModalVisible, setAddEventModalVisible] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');
    const [newEventDate, setNewEventDate] = useState<Date>(new Date());
    const [newEventDateSet, setNewEventDateSet] = useState(false); // whether user has picked
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [newEventLocation, setNewEventLocation] = useState('');
    const [newEventLocationCoords, setNewEventLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [newEventCategory, setNewEventCategory] = useState('');
    const [userRoute, setUserRoute] = useState<any[]>([]);

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
            setSelectedCategories([route.params.category]);
        }
    }, [route.params]);

    useEffect(() => {
        // Fetch other non-event data if needed
        if (activeTab === 'People') {
            fetchPeopleActivities();
        } else if (activeTab === 'Builders' && builderData.length === 0) {
            setBuilderData([
                { id: '1', name: 'TechHub', location: 'Downtown', description: 'Co-working space for founders.' }
            ]);
        }
    }, [activeTab]);

    async function fetchPeopleActivities() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('daily_activities')
                .select('*, profiles(*)');

            if (error) throw error;
            setPeopleData(data || []);
        } catch (error) {
            console.error('Error fetching people activities:', error);
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

            // 1. Check if a social chat already exists
            const { data: existingChats, error: chatError } = await supabase
                .from('chat_participants')
                .select('chat_id, chats!inner(type)')
                .eq('user_id', user.id)
                .eq('chats.type', 'social');

            if (chatError) throw chatError;

            let chatId = null;
            if (existingChats && existingChats.length > 0) {
                // Check if targetUser is also in any of these chats
                const chatIds = existingChats.map(c => c.chat_id);
                const { data: sharedParticipants } = await supabase
                    .from('chat_participants')
                    .select('chat_id')
                    .in('chat_id', chatIds)
                    .eq('user_id', targetUser.id)
                    .single();

                if (sharedParticipants) {
                    chatId = sharedParticipants.chat_id;
                }
            }

            // 2. If not, create a new chat
            if (!chatId) {
                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({ type: 'social', name: 'Direct Message' })
                    .select()
                    .single();

                if (createError) throw createError;
                chatId = newChat.id;

                // Add participants
                await supabase.from('chat_participants').insert([
                    { chat_id: chatId, user_id: user.id },
                    { chat_id: chatId, user_id: targetUser.id }
                ]);
            }

            navigation.navigate('ChatDetail', {
                chatId: chatId,
                otherUserName: targetUser.full_name || targetUser.username || 'User'
            });

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
                (item.title || item.name || '').toLowerCase().includes(lower) ||
                (item.description || item.bio || '').toLowerCase().includes(lower)
            );
        }

        // Filter by Category
        if (selectedCategories.length > 0) {
            if (activeTab === 'Events') {
                currentData = currentData.filter(item => selectedCategories.includes(item.category));
            } else if (activeTab === 'People') {
                currentData = currentData.filter(item => selectedCategories.includes(item.category));
            }
        }

        // Sort events by proximity to user route
        if (activeTab === 'Events' && userRoute.length > 0) {
            currentData = currentData.map((ev: Event) => {
                if (ev.latitude != null && ev.longitude != null) {
                    return { ...ev, distanceKm: minDistanceToRoute(ev.latitude, ev.longitude, userRoute) };
                }
                return { ...ev, distanceKm: Infinity };
            });
            currentData.sort((a: any, b: any) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        }

        return currentData;
    };

    const handleAddEvent = () => {
        if (!newEventTitle || !newEventCategory) return;

        // Format time for display
        const timeDisplay = newEventDateSet ? formatPickedDateTime(newEventDate) : 'TBD';

        const newEvent: Event = {
            id: Date.now().toString(),
            title: newEventTitle,
            description: newEventDesc,
            time: timeDisplay,
            location: newEventLocation || 'TBD',
            image_url: DEFAULT_ILLUSTRATION,
            category: newEventCategory,
            isCustom: true,
            joined: true,
            latitude: newEventLocationCoords?.lat,
            longitude: newEventLocationCoords?.lng,
            startDate: newEventDateSet ? newEventDate : undefined,
        };

        createEvent(newEvent);
        resetAddEventForm();
        setAddEventModalVisible(false);
    };

    const resetAddEventForm = () => {
        setNewEventTitle('');
        setNewEventDesc('');
        setNewEventDate(new Date());
        setNewEventDateSet(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
        setNewEventLocation('');
        setNewEventLocationCoords(null);
        setNewEventCategory('');
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
                    <Image source={require('@/assets/images/activity.jpg')} style={styles.eventImage} />
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

                        {/* Join Button */}
                        <TouchableOpacity
                            style={[
                                styles.joinButton,
                                eventItem.joined && styles.joinedButton
                            ]}
                            onPress={() => !eventItem.joined && joinEvent(eventItem.id)}
                            disabled={eventItem.joined}
                        >
                            <Text style={[
                                styles.joinButtonText,
                                eventItem.joined && styles.joinedButtonText
                            ]}>
                                {eventItem.joined ? 'Joined' : 'Join Group'}
                            </Text>
                        </TouchableOpacity>
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
                        <Image
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

                    <Text style={styles.activityContent}>"{activity.content}"</Text>

                    <TouchableOpacity
                        style={styles.personMessageBtn}
                        onPress={() => handleStartChat(profile)}
                        disabled={messagingLoading === profile?.id}
                    >
                        <Text style={styles.personMessageBtnText}>Message</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (activeTab === 'Builders') {
            return (
                <View style={styles.simpleCard}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.expertise?.join(', ')}</Text>
                    <Text style={styles.cardDesc}>{item.bio}</Text>
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <Image
                source={require('@/assets/images/image.jpg')}
                style={StyleSheet.absoluteFill}
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
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                                {activeTab === tab && <View style={styles.activeLine} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentContainer}>
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
                    style={[styles.fab, { bottom: insets.bottom + 80 }]} // Adjusted to be above navbar
                    onPress={() => setAddEventModalVisible(true)}
                >
                    <Ionicons name="add" size={32} color="white" />
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
                                    {TAGS.map(tag => (
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

            {/* Add Event Modal */}
            <Modal
                visible={addEventModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddEventModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Event</Text>

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
                                value={newEventTitle}
                                onChangeText={setNewEventTitle}
                            />

                            <Text style={styles.inputLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                                {TAGS.map(tag => (
                                    <TouchableOpacity
                                        key={tag.name}
                                        style={[
                                            styles.categoryChip,
                                            newEventCategory === tag.name && styles.categoryChipSelected
                                        ]}
                                        onPress={() => setNewEventCategory(tag.name)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            newEventCategory === tag.name && styles.categoryChipTextSelected
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
                                value={newEventDesc}
                                onChangeText={setNewEventDesc}
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
                                        setNewEventLocation(place.name);
                                        setNewEventLocationCoords({ lat: place.lat, lng: place.lng });
                                    }}
                                    placeholder="Search for a location..."
                                />
                            </View>
                            {newEventLocation ? (
                                <View style={styles.selectedLocationBadge}>
                                    <Ionicons name="location" size={16} color="#5B7FFF" />
                                    <Text style={styles.selectedLocationText}>{newEventLocation}</Text>
                                </View>
                            ) : null}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setAddEventModalVisible(false);
                                    resetAddEventForm();
                                }}
                            >
                                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handleAddEvent}>
                                <Text style={styles.modalButtonText}>Create Event</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5EA', // Fallback
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
        color: '#1A1A1A',
        marginTop: 10,
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
        color: '#1A1A1A',
    },
    activeLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#1A1A1A',
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
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f8f8f8',
    },
    eventImage: {
        width: 100,
        height: 100,
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
        marginBottom: 4,
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
        marginBottom: 10,
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    joinButton: {
        backgroundColor: '#5B7FFF',
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
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
    fab: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#5B7FFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
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
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
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
        flex: 1,
    },
    cancelButtonText: {
        color: '#666',
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
}); 