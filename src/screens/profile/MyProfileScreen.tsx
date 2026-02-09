import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');

// Fallback Mock Data
const MOCK_PATH = [
    { latitude: 37.7749, longitude: -122.4194 },
    { latitude: 36.6002, longitude: -121.8947 },
];

export default function MyProfileScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('Groups');
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchProfile();
        fetchJoinedEvents();
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
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) setProfile(data);
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchJoinedEvents() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch events where the user is a participant
            // Note: intricate join might be needed, or just two queries.
            // For simplicity in this demo, let's fetch all events and filter (not performant for prod but good for prototype)
            // OR better: fetch event_participants then fetch events.

            const { data: participations } = await supabase
                .from('event_participants')
                .select('event_id')
                .eq('user_id', user.id);

            if (participations && participations.length > 0) {
                const eventIds = participations.map(p => p.event_id);
                const { data: events } = await supabase
                    .from('events')
                    .select('*')
                    .in('id', eventIds);

                if (events) setJoinedEvents(events);
            } else {
                // If no joined events, maybe show all events for demo purposes or empty state?
                // For this demo, let's just show mock events if empty so the UI isn't blank for the user review.
                // UNLESS we want to force them to join.
                // Let's show "No joined events" state.
            }

        } catch (error) {
            console.log('Error fetching events:', error);
        }
    }

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#5659ab" /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Header Title Overlay */}
            <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Account</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header Map with Curve */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: 37.0,
                            longitude: -122.0,
                            latitudeDelta: 15.0,
                            longitudeDelta: 15.0,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    // Custom map style to be light/purple tinted if needed
                    >
                        {/* Render Route if available, else mock */}
                        <Polyline
                            coordinates={MOCK_PATH}
                            strokeColor="#5659ab"
                            strokeWidth={3}
                            lineDashPattern={[5, 5]}
                        />
                        <Marker coordinate={MOCK_PATH[0]}>
                            <View style={styles.markerDot} />
                        </Marker>
                        <Marker coordinate={MOCK_PATH[1]}>
                            <IconSymbol name="mappin.circle.fill" size={30} color="#5659ab" />
                        </Marker>
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
                        <View style={styles.editIcon}>
                            <IconSymbol name="pencil" size={16} color="#5659ab" />
                        </View>
                    </View>
                </View>

                {/* Profile Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{profile?.full_name || 'Johnny Bravo'}</Text>
                    <Text style={styles.location}>
                        <IconSymbol name="mappin.and.ellipse" size={14} color="#999" /> {profile?.route_start || 'Jeruzalem, Slovenia'} {profile?.route_end ? `→ ${profile.route_end}` : ''}
                    </Text>

                    <View style={styles.badges}>
                        {[1, 2, 3].map((item) => (
                            <View key={item} style={styles.badgeCircle}>
                                <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' }} style={{ width: 25, height: 25, opacity: 0.8 }} />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {['Help', 'Groups'].map(tab => (
                        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <IconSymbol name="clock.arrow.circlepath" size={20} color="#999" />
                        <Text style={styles.sectionTitle}> Your Activity</Text>
                    </View>

                    {/* Dynamic Activity Cards or Empty State */}
                    {joinedEvents.length > 0 ? (
                        joinedEvents.map(event => (
                            <View key={event.id} style={styles.activityCard}>
                                <Text style={styles.activityTitle}>{event.title}</Text>
                                <Text style={styles.activityDesc} numberOfLines={2}>{event.description}</Text>
                                <View style={styles.activityFooter}>
                                    <View style={styles.timeTag}>
                                        <IconSymbol name="clock" size={14} color="#5659ab" />
                                        <Text style={styles.timeText}> {new Date(event.start_time).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={[styles.activityCard, { alignItems: 'center', padding: 30 }]}>
                            <Text style={{ color: '#999', textAlign: 'center' }}>No upcoming activities joined.</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SocialFeed')} style={{ marginTop: 10 }}>
                                <Text style={{ color: '#5659ab', fontWeight: 'bold' }}>Find Events</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </View>

            </ScrollView>
        </View>
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
    markerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5659ab' },

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
    badges: { flexDirection: 'row', marginTop: 20, gap: 20 },
    badgeCircle: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#fbeab5',
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff'
    },
    badgeCircle2: { backgroundColor: '#e0e0ff' },

    tabsContainer: {
        flexDirection: 'row', paddingHorizontal: 40, marginTop: 30, borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    tab: { paddingVertical: 15, paddingHorizontal: 10, marginRight: 20 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: '#5659ab' },
    tabText: { fontSize: 16, color: '#999', fontWeight: '600' },
    activeTabText: { color: '#333' },

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
    activityTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    activityDesc: { fontSize: 14, color: '#666', marginTop: 5, lineHeight: 20 },
    activityFooter: { flexDirection: 'column', marginTop: 15, gap: 10 },
    members: { flexDirection: 'row', alignItems: 'center' },
    memberAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: -8, borderWidth: 1, borderColor: 'white' },
    memberCount: { fontSize: 12, color: '#aaa', marginLeft: 15 },
    timeTag: { flexDirection: 'row', alignItems: 'center' },
    timeText: { fontSize: 13, color: '#5659ab', marginLeft: 5, fontWeight: '600' }
});
