import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEvents } from '@/context/EventsContext';
import { useRevenueCat } from '@/context/RevenueCatContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

// Fallback Mock Data
const MOCK_PATH = [
    { latitude: 37.7749, longitude: -122.4194 },
    { latitude: 36.6002, longitude: -121.8947 },
];

export default function MyProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [myBuilder, setMyBuilder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { userEvents, leaveEvent, deleteEvent } = useEvents();
    const { isPro } = useRevenueCat();
    const [activeTab, setActiveTab] = useState('Groups');
    const [showQR, setShowQR] = useState(false);
    const [dailyActivity, setDailyActivity] = useState('');
    const [dailyCategory, setDailyCategory] = useState('Sport');
    const [isSavingActivity, setIsSavingActivity] = useState(false);
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }


            const { data, error } = await supabase
                .from('profiles')
                .select('*, route_data')
                .eq('id', user.id)
                .single();

            if (data) setProfile(data);

            // Fetch daily activity
            const { data: activityData } = await supabase
                .from('daily_activities')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (activityData) {
                setDailyActivity(activityData.content);
                setDailyActivity(activityData.content);
                setDailyCategory(activityData.category);
            }

            // Fetch builder profile
            const { data: builderData } = await supabase
                .from('builder_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Also check 'builders' table if 'builder_profiles' is empty or related
            // The schema showed 'builders' has 'owner_id', let's check that too
            const { data: buildersTable } = await supabase
                .from('builders')
                .select('*')
                .eq('owner_id', user.id);

            setMyBuilder(builderData || (buildersTable && buildersTable[0]));

        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }

    const saveDailyActivity = async () => {
        if (!dailyActivity.trim()) {
            Alert.alert('Error', 'Please enter what you want to do today.');
            return;
        }

        try {
            setIsSavingActivity(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('daily_activities')
                .upsert({
                    user_id: user.id,
                    content: dailyActivity,
                    category: dailyCategory,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            Alert.alert('Success', 'Activity saved!', [
                { text: 'OK' },
                {
                    text: 'Find Friends',
                    onPress: () => navigation.navigate('Social', {
                        activeTab: 'People',
                        category: dailyCategory
                    })
                }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setIsSavingActivity(false);
        }
    };

    const handleExitGroup = (eventId: string) => {
        Alert.alert(
            "Exit Group",
            "Are you sure you want to leave this group?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Exit", style: "destructive", onPress: () => leaveEvent(eventId) }
            ]
        );
    };

    const handleDeleteEvent = (eventId: string) => {
        Alert.alert(
            "Delete Event",
            "Are you sure you want to delete this event? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteEvent(eventId) }
            ]
        );
    };

    const handleEventChat = async (event: any) => {
        try {
            // @ts-ignore
            const { data: chatId, error } = await supabase.rpc('get_or_create_event_chat', {
                _event_id: event.id,
                _event_name: event.title
            });

            if (error) throw error;
            if (chatId) {
                // Navigate to Chat tab first, then to the specific conversation
                navigation.navigate('Chat', { initialTab: 'events' });

                // Small delay to ensure tab switch completes before pushing detail
                setTimeout(() => {
                    navigation.navigate('ChatDetail', {
                        chatId,
                        otherUserName: event.title,
                        isGroup: true,
                        otherUserAvatar: event.image_url
                    });
                }, 100);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Could not open chat: ' + error.message);
        }
    };

    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number, longitude: number }[]>([]);

    useEffect(() => {
        if (profile?.route_data && profile.route_data.length > 1) {
            fetchRoute(profile.route_data);
        }
    }, [profile]);

    const fetchRoute = async (points: any[]) => {
        try {
            const coordinatesString = points.map(p => `${p.lng},${p.lat}`).join(';');
            const url = `http://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const geometry = data.routes[0].geometry;
                if (geometry.type === 'LineString') {
                    const path = geometry.coordinates.map((coord: number[]) => ({
                        latitude: coord[1],
                        longitude: coord[0]
                    }));
                    setRouteCoordinates(path);
                }
            }
            // The following lines were added based on the user's instruction.
            // Note: The original `map` function was already correctly closed.
            // This `});` might be a misplaced closing bracket from another context.
            // The `setConversations` call is also new and its context is unclear.
            // Applying it literally as requested, assuming it's intended for this scope.
            // If this causes a syntax error or logical issue, please provide more context.
            // }); // This line is commented out as it would cause a syntax error.
            // setConversations(formatted); // This line is commented out as 'formatted' and 'setConversations' are not defined in this scope.

        } catch (error) {
            console.warn("Error fetching profile route:", error);
        }
    };

    const mapRef = React.useRef<MapView>(null);

    useEffect(() => {
        if (routeCoordinates.length > 0 && mapRef.current) {
            mapRef.current.fitToCoordinates(routeCoordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: false
            });

            // Add a slight pitch (angle) for a 3D effect
            setTimeout(() => {
                if (mapRef.current) {
                    mapRef.current.animateCamera({ pitch: 45, heading: 0 }, { duration: 1000 });
                }
            }, 100);
        }
    }, [routeCoordinates]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4d73ba" /></View>;
    }

    return (
        <View style={styles.container}>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header Map with Curve */}
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: profile?.latitude || 46.0569, // Default to Ljubljana
                            longitude: profile?.longitude || 14.5058,
                            latitudeDelta: profile?.route_data?.length > 1 ? 15.0 : 0.4,
                            longitudeDelta: profile?.route_data?.length > 1 ? 15.0 : 0.4,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        onPress={() => navigation.navigate('RoutePreviewScreen', { userId: profile?.id })}
                    >
                        {/* Render Route if available */}
                        {profile?.route_data && profile.route_data.length > 1 && (
                            <Polyline
                                coordinates={routeCoordinates.length > 0 ? routeCoordinates : profile.route_data.map((p: any) => ({ latitude: p.lat, longitude: p.lng }))}
                                strokeColor="#4d73ba"
                                strokeWidth={3}
                            // lineDashPattern={[5, 5]} // Removed dash for solid road line
                            />
                        )}

                        {/* Render Markers for Route */}
                        {profile?.route_data && profile.route_data.map((p: any, i: number) => (
                            <Marker
                                key={i}
                                coordinate={{ latitude: p.lat, longitude: p.lng }}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <View style={styles.markerDot} />
                            </Marker>
                        ))}

                        {/* Fallback Mock Data if no route */}
                        {!profile?.route_data && (
                            <>
                                <Polyline
                                    coordinates={MOCK_PATH}
                                    strokeColor="#4d73ba"
                                    strokeWidth={3}
                                    lineDashPattern={[5, 5]}
                                />
                                <Marker coordinate={MOCK_PATH[0]}>
                                    <View style={styles.markerDot} />
                                </Marker>
                                <Marker coordinate={MOCK_PATH[1]}>
                                    <IconSymbol name="mappin.circle.fill" size={30} color="#4d73ba" />
                                </Marker>
                            </>
                        )}
                    </MapView>

                    {/* SVG Curve Mask Overlay */}
                    <View style={styles.curveContainer}>
                        <Svg height="100%" width="100%" viewBox="0 0 1340 320" style={styles.svgCurve}>
                            <Path
                                fill="#FDFDFD"
                                d="M0,80 Q720,300 1440,80 L1440,400 L0,400 Z"
                            />
                        </Svg>
                    </View>

                    <View style={styles.avatarContainer}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <Image source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }} style={styles.avatar} />
                        )}
                        <TouchableOpacity
                            style={styles.editIcon}
                            onPress={() => navigation.navigate('EditProfileScreen')}
                        >
                            <IconSymbol name="pencil" size={16} color="#4d73ba" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{profile?.full_name || 'Johnny Bravo'}</Text>
                    <View style={styles.locationRow}>
                        <IconSymbol name="mappin.and.ellipse" size={14} color="#999" />
                        <Text style={styles.location}>
                            {profile?.route_data && profile.route_data.length > 0 ? (
                                profile.route_data.slice(0, 3).map((checkpoint: any, index: number) => (
                                    <Text key={index}>
                                        <Text style={index === 0 ? styles.currentLocation : styles.routeLocation}>
                                            {checkpoint.name || checkpoint.city || 'Unknown'}
                                        </Text>
                                        {index < Math.min(profile.route_data.length - 1, 2) && <Text style={styles.routeLocation}> → </Text>}
                                    </Text>
                                ))
                            ) : (
                                <Text style={styles.routeLocation}>No route set</Text>
                            )}
                        </Text>
                    </View>

                    <View style={styles.badges}>
                        {/* Verified Nomad Badge */}
                        <View style={[styles.badgeItem, !profile?.is_verified && styles.badgeLocked]}>
                            <View style={[styles.badgeCircle, profile?.is_verified ? styles.badgeVerified : styles.badgeDimmed]}>
                                <Ionicons name="checkmark-circle" size={26} color={profile?.is_verified ? '#fff' : '#ccc'} />
                            </View>
                            <Text style={[styles.badgeLabel, !profile?.is_verified && styles.badgeLabelDimmed]}>
                                Verified
                            </Text>
                        </View>

                        {/* Pro Badge */}
                        <View style={[styles.badgeItem, !isPro && styles.badgeLocked]}>
                            <View style={[styles.badgeCircle, isPro ? styles.badgePro : styles.badgeDimmed]}>
                                <Ionicons name="flash" size={26} color={isPro ? '#fff' : '#ccc'} />
                            </View>
                            <Text style={[styles.badgeLabel, !isPro && styles.badgeLabelDimmed]}>
                                Pro
                            </Text>
                        </View>
                    </View>


                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {['Social', 'Groups', 'Builders'].map(tab => (
                        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            {activeTab === tab && <View style={styles.activeLine} />}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="clock.arrow.circlepath" size={20} color="#999" />
                        <Text style={styles.sectionTitle}> Your Activity</Text>
                    </View>

                    {/* Dynamic Activity Cards or Empty State */}
                    {activeTab === 'Groups' && (
                        userEvents.length > 0 ? (
                            userEvents.map(event => (
                                <View key={event.id} style={styles.eventCard}>
                                    <ExpoImage source={require('@/assets/images/activity.jpg')} style={styles.eventImage} />
                                    <View style={styles.eventContent}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.eventTitle}>{event.title}</Text>
                                            {event.category && (
                                                <View style={styles.categoryBadgeSmall}>
                                                    <Text style={styles.categoryBadgeTextSmall}>{event.category}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>

                                        <View style={styles.infoRow}>
                                            <Ionicons name="time-outline" size={16} color="#5B7FFF" />
                                            <Text style={styles.infoText}>{event.time}</Text>
                                        </View>
                                        {event.location && (
                                            <View style={styles.infoRow}>
                                                <Ionicons name="location-outline" size={16} color="#5B7FFF" />
                                                <Text style={styles.infoText}>{event.location}</Text>
                                            </View>
                                        )}

                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.greyActionButton]}
                                                onPress={() => event.isCustom ? handleDeleteEvent(event.id) : handleExitGroup(event.id)}
                                            >
                                                <Ionicons
                                                    name={event.isCustom ? "trash-outline" : "exit-outline"}
                                                    size={18}
                                                    color="white"
                                                />
                                                <Text style={styles.actionBtnText}>{event.isCustom ? 'Delete' : 'Leave'}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.chatActionButton]}
                                                onPress={() => handleEventChat(event)}
                                            >
                                                <Ionicons
                                                    name="chatbubbles-outline"
                                                    size={18}
                                                    color="white"
                                                />
                                                <Text style={styles.actionBtnText}>Chat</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={[styles.activityCard, { alignItems: 'center', padding: 30 }]}>
                                <Text style={{ color: '#999', textAlign: 'center' }}>No upcoming activities joined.</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Social')} style={{ marginTop: 10 }}>
                                    <Text style={{ color: '#4d73ba', fontWeight: 'bold' }}>Find Events</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}

                    {activeTab === 'Social' && (
                        <View style={styles.activityCard}>
                            <Text style={styles.socialPrompt}>What do you want to do today?</Text>
                            <TextInput
                                style={styles.socialInput}
                                placeholder="e.g. I want to go on a 5 hour hike"
                                value={dailyActivity}
                                onChangeText={setDailyActivity}
                                multiline
                            />

                            <Text style={styles.categoryLabel}>Category</Text>
                            <View style={styles.categoryRow}>
                                {['Sport', 'Art', 'Tech', 'Music'].map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.categoryBtn, dailyCategory === cat && styles.activeCategoryBtn]}
                                        onPress={() => setDailyCategory(cat)}
                                    >
                                        <Text style={[styles.categoryBtnText, dailyCategory === cat && styles.activeCategoryBtnText]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={saveDailyActivity}
                                disabled={isSavingActivity}
                            >
                                {isSavingActivity ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save Activity</Text>
                                )}
                            </TouchableOpacity>

                            {dailyActivity && !isSavingActivity && (
                                <TouchableOpacity
                                    style={styles.findFriendBtn}
                                    onPress={() => navigation.navigate('Social', {
                                        activeTab: 'People',
                                        category: dailyCategory
                                    })}
                                >
                                    <Text style={styles.findFriendBtnText}>Find Friends</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}


                    {activeTab === 'Builders' && (
                        <View style={styles.activityCard}>
                            {myBuilder ? (
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                                        <Text style={styles.activityTitle}>{myBuilder.business_name || myBuilder.name || 'My Builder Profile'}</Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('EditBuilderProfile')}>
                                            <IconSymbol name="pencil.circle.fill" size={24} color="#4d73ba" />
                                        </TouchableOpacity>
                                    </View>

                                    {myBuilder.bio && <Text style={styles.activityDesc}>{myBuilder.bio}</Text>}
                                    {myBuilder.description && <Text style={styles.activityDesc}>{myBuilder.description}</Text>}

                                    <View style={{ marginTop: 15, flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                        {(myBuilder.expertise || []).map((skill: string, idx: number) => (
                                            <View key={idx} style={{ backgroundColor: '#eef0ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                                                <Text style={{ color: '#4d73ba', fontSize: 12 }}>{skill}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {myBuilder.hourly_rate && (
                                        <Text style={{ marginTop: 15, fontWeight: 'bold', color: '#333' }}>
                                            Rate: ${myBuilder.hourly_rate}/hr
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', padding: 20 }}>
                                    <IconSymbol name="hammer.fill" size={40} color="#ddd" />
                                    <Text style={{ color: '#666', marginTop: 10, textAlign: 'center' }}>
                                        You don't have a builder profile yet.
                                    </Text>
                                    <TouchableOpacity style={[styles.saveBtn, { marginTop: 20, width: '100%' }]} onPress={() => navigation.navigate('BecomeBuilder')}>
                                        <Text style={styles.saveBtnText}>Become a Builder</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                </View>

                {/* Invite Code Sharing - Only for Verified Users */}
                {
                    profile?.invite_code && profile?.is_verified && (
                        <View style={styles.inviteCard}>
                            <View style={styles.inviteHeader}>
                                <Ionicons name="people-outline" size={20} color="#4d73ba" />
                                <Text style={styles.inviteTitle}>Your Invite Code</Text>
                            </View>
                            <Text style={styles.inviteSubtitle}>Share with new nomads to verify them</Text>

                            <View style={styles.codeRow}>
                                <Text style={styles.codeText}>{profile.invite_code}</Text>
                                <TouchableOpacity
                                    style={styles.copyBtn}
                                    onPress={async () => {
                                        await Clipboard.setStringAsync(profile.invite_code);
                                        Alert.alert('Copied!', 'Invite code copied to clipboard.');
                                    }}
                                >
                                    <Ionicons name="copy-outline" size={18} color="#4d73ba" />
                                    <Text style={styles.copyBtnText}>Copy</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.qrToggle}
                                onPress={() => setShowQR(!showQR)}
                            >
                                <Ionicons name={showQR ? "chevron-up" : "qr-code-outline"} size={16} color="#4d73ba" />
                                <Text style={styles.qrToggleText}>{showQR ? 'Hide QR' : 'Show QR Code'}</Text>
                            </TouchableOpacity>

                            {showQR && (
                                <View style={styles.qrContainer}>
                                    <QRCode value={profile.invite_code} size={160} backgroundColor="white" color="#333" />
                                    <Text style={styles.qrHint}>New users can scan this to get verified</Text>
                                </View>
                            )}
                        </View>
                    )
                }
            </ScrollView >

            {/* Fixed Header - Outside ScrollView, at bottom of JSX for top rendering */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Account</Text>
                <View style={{ width: 24 }} />
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerOverlay: {
        position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    backButton: { padding: 5 },
    scrollContent: { paddingBottom: 100 },
    mapContainer: { height: 320, width: '100%', position: 'relative' },
    map: { ...StyleSheet.absoluteFillObject },
    curveContainer: { position: 'absolute', bottom: 0, width: '100%', height: 100, justifyContent: 'flex-end' },
    svgCurve: { position: 'absolute', bottom: -1 }, // Shift down to cover gap
    markerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4d73ba' },

    avatarContainer: {
        position: 'absolute',
        bottom: 1,
        alignSelf: 'center',
        width: 190,
        height: 190,
        borderRadius: 190,
        backgroundColor: 'FDFDFD',
        padding: 4,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee'
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 18,
        backgroundColor: 'white',
        width: 35,
        height: 35,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    infoContainer: { alignItems: 'center', marginTop: 10 },
    name: { fontSize: 26, fontWeight: 'bold', color: '#222' },
    location: { fontSize: 14, color: 'gray', marginTop: 5 },
    badges: { flexDirection: 'row', marginTop: 20, gap: 24, justifyContent: 'center' },
    badgeItem: { alignItems: 'center', gap: 4 },
    badgeLocked: { opacity: 0.4 },
    badgeCircle: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3,
    },
    badgeVerified: { backgroundColor: '#34C759' },
    badgePro: { backgroundColor: '#FFD700' },
    badgeDimmed: { backgroundColor: '#e8e8e8' },
    badgeLabel: { fontSize: 11, fontWeight: '600', color: '#555' },
    badgeLabelDimmed: { color: '#bbb' },

    inviteCard: {
        marginTop: 20, marginHorizontal: 20, backgroundColor: 'white', borderRadius: 16,
        padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
    },
    inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inviteTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    inviteSubtitle: { fontSize: 12, color: '#999', marginTop: 4, marginBottom: 12 },
    codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f5f5ff', borderRadius: 12, padding: 14 },
    codeText: { fontSize: 22, fontWeight: 'bold', letterSpacing: 3, color: '#4d73ba' },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef0ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    copyBtnText: { fontSize: 13, fontWeight: '600', color: '#4d73ba' },
    qrToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
    qrToggleText: { fontSize: 13, color: '#4d73ba', fontWeight: '600' },
    qrContainer: { alignItems: 'center', marginTop: 10, padding: 15, backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    qrHint: { fontSize: 11, color: '#aaa', marginTop: 10 },

    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 40,
        marginTop: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 30,
    },
    tab: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        position: 'relative',
    },
    activeTab: {},
    tabText: {
        fontSize: 18,
        color: '#999',
        fontWeight: '600'
    },
    activeTabText: {
        color: '#333' // Black text for active tab
    },
    activeLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#5B7FFF',
        borderRadius: 2,
    },

    content: { padding: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, opacity: 0.6 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 5 },

    activityCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        marginBottom: 20
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    actionButton: {
        padding: 5,
        marginTop: -5,
        marginRight: -5,
    },
    activityTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10
    },
    activityDesc: { fontSize: 14, color: '#666', marginTop: 5, lineHeight: 20 },
    activityFooter: { flexDirection: 'column', marginTop: 15, gap: 10 },
    members: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: -8, borderWidth: 1, borderColor: 'white' },
    memberCount: { fontSize: 12, color: '#aaa', marginLeft: 15 },
    timeTag: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 13, color: '#4d73ba', marginLeft: 5, fontWeight: '600' },

    // Social Tab Styles
    socialPrompt: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    socialInput: {
        backgroundColor: '#f5f5ff',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        color: '#333',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20
    },
    categoryLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10 },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
    categoryBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    activeCategoryBtn: {
        backgroundColor: '#4d73ba',
        borderColor: '#4d73ba'
    },
    categoryBtnText: { fontSize: 14, color: '#666' },
    activeCategoryBtnText: { color: 'white', fontWeight: 'bold' },
    saveBtn: {
        backgroundColor: '#4d73ba',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10
    },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    findFriendBtn: {
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4d73ba'
    },
    findFriendBtnText: { color: '#4d73ba', fontWeight: 'bold' },

    // Route Display Styles
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    currentLocation: {
        color: '#5B7FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    routeLocation: {
        color: '#999',
        fontSize: 14,
    },

    // Event Card Styles (matching SocialFeedScreen)
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
    actionButtons: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20, // Increased from 10 to 20 for more rounded appearance
        gap: 6,
    },
    deleteActionButton: {
        backgroundColor: '#FF3B30',
    },
    leaveActionButton: {
        backgroundColor: '#5B7FFF',
    },
    greyActionButton: {
        backgroundColor: '#8E8E93', // Grey for leave button
    },
    chatActionButton: {
        backgroundColor: '#5B7FFF', // Violet for chat button
    },
    actionBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
});
