import React, { useRef, useState } from 'react';
import {
    View, StyleSheet, Text, ScrollView, Dimensions, TouchableOpacity,
    StatusBar, FlatList, NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RouteMap, Checkpoint } from '../../components/map/RouteMap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// We'll receive the full profile via route params
type ProfileDetailParams = {
    ProfileDetail: {
        profile: {
            id: string;
            name: string;
            age: number;
            bio: string;
            images: string[];
            distance?: string;
            route_data?: any[];
        };
        myRouteData?: any[];
    };
};

export default function ProfileDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ProfileDetailParams, 'ProfileDetail'>>();
    const insets = useSafeAreaInsets();
    const { profile, myRouteData } = route.params;

    // Horizontal paging: 0 = Info, 1 = Travel Path
    const [activePage, setActivePage] = useState(0);
    const horizontalRef = useRef<FlatList>(null);

    const checkpoints: Checkpoint[] = (profile.route_data || []).map((p: any, i: number) => ({
        id: String(i),
        name: p.name || `Stop ${i + 1}`,
        lat: p.lat,
        lng: p.lng,
        startDate: p.startDate,
        endDate: p.endDate,
        durationDays: p.durationDays,
    }));

    // Current user's route as secondary checkpoints
    const myCheckpoints: Checkpoint[] = (myRouteData || []).map((p: any, i: number) => ({
        id: `my-${i}`,
        name: p.name || `My Stop ${i + 1}`,
        lat: p.lat,
        lng: p.lng,
        startDate: p.startDate,
        endDate: p.endDate,
        durationDays: p.durationDays,
    }));

    const onHorizontalScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / width);
        setActivePage(page);
    };

    const pages = [
        // Page 0: Profile Info
        <ScrollView key="info" style={{ width }} contentContainerStyle={styles.infoPage}>
            {/* Hero Image */}
            <View style={styles.heroContainer}>
                <Image
                    source={{ uri: profile.images[0] || 'https://via.placeholder.com/400x600' }}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={200}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.heroGradient}
                >
                    <Text style={styles.heroName}>{profile.name}, {profile.age}</Text>
                    {profile.distance && (
                        <Text style={styles.heroDistance}>📍 {profile.distance}</Text>
                    )}
                </LinearGradient>
            </View>

            {/* Bio Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{profile.bio || 'No bio yet.'}</Text>
            </View>

            {/* Photo Gallery */}
            {profile.images.length > 1 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                        {profile.images.slice(1).map((uri, i) => (
                            <Image
                                key={i}
                                source={{ uri }}
                                style={styles.photoThumb}
                                contentFit="cover"
                                transition={200}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Travel Stats */}
            {checkpoints.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Travel Journey</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>{checkpoints.length}</Text>
                            <Text style={styles.statLabel}>Stops</Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statNumber}>
                                {checkpoints.reduce((acc, c) => acc + (c.durationDays || 0), 0)}
                            </Text>
                            <Text style={styles.statLabel}>Days</Text>
                        </View>
                    </View>

                    {/* Checkpoint List */}
                    {checkpoints.map((cp, i) => (
                        <View key={cp.id} style={styles.checkpointItem}>
                            <View style={styles.checkpointDot} />
                            {i < checkpoints.length - 1 && <View style={styles.checkpointLine} />}
                            <View style={styles.checkpointInfo}>
                                <Text style={styles.checkpointName}>{cp.name}</Text>
                                {cp.durationDays ? (
                                    <Text style={styles.checkpointDuration}>{cp.durationDays} days</Text>
                                ) : null}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>,

        // Page 1: Travel Path Map
        <View key="map" style={{ width, flex: 1 }}>
            {checkpoints.length > 0 ? (
                <RouteMap
                    checkpoints={checkpoints}
                    secondaryCheckpoints={myCheckpoints.length > 0 ? myCheckpoints : undefined}
                    primaryLabel={`${profile.name}'s route`}
                    secondaryLabel="My route"
                    style={{ flex: 1 }}
                />
            ) : (
                <View style={styles.emptyMap}>
                    <Text style={styles.emptyMapText}>No travel path yet</Text>
                </View>
            )}
            {/* Back to Profile button */}
            <TouchableOpacity
                style={[styles.backToProfile, { bottom: insets.bottom + 24 }]}
                onPress={() => horizontalRef.current?.scrollToIndex({ index: 0, animated: true })}
            >
                <Text style={styles.backToProfileText}>← Profile</Text>
            </TouchableOpacity>
        </View>,
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>

            {/* Page Indicator */}
            <View style={[styles.pageIndicator, { top: insets.top + 14 }]}>
                <View style={[styles.dot, activePage === 0 && styles.dotActive]} />
                <View style={[styles.dot, activePage === 1 && styles.dotActive]} />
            </View>

            {/* Horizontal Pages */}
            <FlatList
                ref={horizontalRef}
                data={pages}
                renderItem={({ item }) => item}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onHorizontalScroll}
                keyExtractor={(_, i) => String(i)}
                bounces={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        left: 16,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    pageIndicator: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 10,
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 20,
    },

    // Info Page
    infoPage: {
        paddingBottom: 40,
    },
    heroContainer: {
        width,
        height: height * 0.55,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 120,
        justifyContent: 'flex-end',
        padding: 20,
    },
    heroName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    heroDistance: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },

    // Sections
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    bioText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },

    // Photos
    photoRow: {
        flexDirection: 'row',
    },
    photoThumb: {
        width: 120,
        height: 160,
        borderRadius: 12,
        marginRight: 10,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        gap: 30,
        marginBottom: 16,
    },
    stat: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#5B7FFF',
    },
    statLabel: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },

    // Checkpoints Timeline
    checkpointItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginLeft: 8,
        paddingBottom: 16,
    },
    checkpointDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#5B7FFF',
        marginTop: 4,
    },
    checkpointLine: {
        position: 'absolute',
        left: 5,
        top: 16,
        bottom: 0,
        width: 2,
        backgroundColor: '#D0D5FF',
    },
    checkpointInfo: {
        marginLeft: 14,
    },
    checkpointName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    checkpointDuration: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },

    // Empty Map
    emptyMap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyMapText: {
        color: '#999',
        fontSize: 16,
    },

    // Back to Profile button
    backToProfile: {
        position: 'absolute',
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backToProfileText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});
