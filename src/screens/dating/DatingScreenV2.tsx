
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    interpolate,
    Extrapolation,
    withTiming
} from 'react-native-reanimated';
import { ReanimatedSwipeCard } from '../../components/dating/ReanimatedSwipeCard';
import { supabase } from '../../lib/supabase';
import { useRevenueCat } from '../../context/RevenueCatContext';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DatingScreenV2() {
    const navigation = useNavigation<any>();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRoute, setUserRoute] = useState<any[]>([]);
    const [swipesToday, setSwipesToday] = useState(0);
    const { isPro } = useRevenueCat();

    // Animation values for the TOP card
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Load profiles on mount
    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user);

            // Fetch current user profile for route data + preferences
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('route_data, user_type, gender, preferred_gender, wants_dating, show_landlovers_dating')
                .eq('id', user.id)
                .single();

            const myRoute = (myProfile?.route_data as any[]) || [];
            setUserRoute(myRoute);
            const referencePoint = myRoute.length > 0 ? myRoute[0] : null;

            // My dating preferences
            const myGender = myProfile?.gender || 'other';
            const myPreferredGender = myProfile?.preferred_gender || 'everyone';
            const showLandlovers = myProfile?.show_landlovers_dating !== false;
            const isNomad = myProfile?.user_type !== 'landlover';

            // Get already-swiped IDs
            const { data: swipes } = await supabase
                .from('swipes')
                .select('swipee_id')
                .eq('swiper_id', user.id);
            const swipedIds = swipes?.map(s => s.swipee_id) || [];

            // Fetch profiles excluding self and already swiped
            // Only show profiles that want to date
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id);

            // wants_dating must be true or NULL (legacy users default to true)
            // Note: Postgres neq ignores NULLs, so we handle it on client or with better server filter
            // For simplicity and legacy support, we'll fetch then filter more on client if needed
            // but we'll try to exclude explicit 'false' seekers
            query = query.or('wants_dating.eq.true,wants_dating.is.null');

            if (swipedIds.length > 0) {
                query = query.not('id', 'in', `(${swipedIds.join(',')})`);
            }

            // If nomad and doesn't want to see landlovers, filter them out
            if (isNomad && !showLandlovers) {
                query = query.neq('user_type', 'landlover');
            }

            // Filter by preferred gender (if not 'everyone')
            if (myPreferredGender && myPreferredGender !== 'everyone') {
                // If they have a preference, match strictly. 
                // Note: This matches NULLs out too, which is why demo profiles weren't showing up.
                query = query.eq('gender', myPreferredGender);
            }

            const { data, error } = await query.limit(40); // Fetch more to allow for filtering
            if (error) throw error;

            // Client-side filter: only show profiles whose preferred_gender matches my gender (or everyone)
            const filtered = data?.filter(p => {
                // 1. Double check they want dating (fallback for NULLs)
                if (p.wants_dating === false) return false;

                // 2. Bidirectional check: Do they want someone of my gender?
                const theirPref = p.preferred_gender || 'everyone';
                if (theirPref !== 'everyone' && theirPref !== myGender) return false;

                return true;
            }) || [];

            const formatted = filtered.map(p => {
                let distanceStr = 'Nearby';
                const pRoute = p.route_data;
                if (referencePoint && pRoute && Array.isArray(pRoute) && pRoute.length > 0) {
                    const firstCp = pRoute[0] as any;
                    if (firstCp && typeof firstCp.lat === 'number' && typeof firstCp.lng === 'number') {
                        const dist = haversineKm(referencePoint.lat, referencePoint.lng, firstCp.lat, firstCp.lng);
                        distanceStr = dist < 1 ? 'Nearby' : `${Math.round(dist)} km away`;
                    }
                }

                return {
                    id: p.id,
                    name: p.full_name || p.username || 'Anonymous',
                    age: p.age || 25,
                    bio: p.bio || 'No bio yet.',
                    images: p.images && p.images.length > 0 ? p.images : ['https://via.placeholder.com/400x800'],
                    distance: distanceStr,
                    route_data: p.route_data || [],
                };
            });

            setProfiles(formatted);
            setCurrentIndex(0);

            // Check today's swipe count
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const { count } = await supabase
                .from('swipes')
                .select('*', { count: 'exact', head: true })
                .eq('swiper_id', user.id)
                .gte('created_at', startOfDay.toISOString());
            if (count !== null) setSwipesToday(count);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Callback when card leaves screen
    const onSwipeComplete = async (direction: 'left' | 'right') => {
        const profile = profiles[currentIndex];
        if (!profile || !currentUser) return;

        const liked = direction === 'right';
        const newCount = swipesToday + 1;
        setSwipesToday(newCount);

        // Supabase RPC
        try {
            const { data, error } = await supabase.rpc('handle_swipe', {
                p_swiper_id: currentUser.id,
                p_swipee_id: profile.id,
                p_liked: liked,
            });

            if (!error && data && (data as any).match) {
                Alert.alert("It's a Match! 🎉", `You matched with ${profile.name}!`, [
                    { text: 'Keep Swiping', style: 'cancel' },
                    {
                        text: 'Send Message',
                        onPress: () => navigation.navigate('ChatDetail', {
                            chatId: (data as any).chat_id,
                            otherUserName: profile.name,
                        }),
                    },
                ]);
            }
        } catch (err) {
            console.error('Swipe error:', err);
        }

        // Check swipe limit
        if (!isPro && newCount >= 10) {
            Alert.alert('Daily Limit Reached', 'Upgrade to Pro for unlimited swipes!', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
            ]);
        }

        // Reset position and advance
        translateX.value = 0;
        translateY.value = 0;
        setCurrentIndex(prev => prev + 1);
    };

    const handlePan = Gesture.Pan()
        .onChange((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                // Swipe Out
                const direction = event.translationX > 0 ? 'right' : 'left';
                const targetX = direction === 'right' ? width * 1.5 : -width * 1.5;

                translateX.value = withTiming(targetX, { duration: 200 }, () => {
                    runOnJS(onSwipeComplete)(direction);
                });
            } else {
                // Return to center
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    // Top Card Style
    const topCardStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-width / 2, 0, width / 2],
            [-10, 0, 10],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` }
            ]
        };
    });

    // Second Card Style (Scale/Opacity Effect)
    const nextCardStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            Math.abs(translateX.value),
            [0, width],
            [0.95, 1],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            Math.abs(translateX.value),
            [0, width],
            [0.8, 1],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }],
            opacity
        };
    });

    if (loading) {
        return <View style={styles.center}><ActivityIndicator /></View>;
    }

    if (currentIndex >= profiles.length) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons name="people-outline" size={80} color="#DDD" />
                </View>
                <Text style={styles.emptyTitle}>No more profiles!</Text>
                <Text style={styles.emptySubtext}>No more profiles nearby at the moment.</Text>

                <TouchableOpacity style={styles.refreshButton} onPress={loadProfiles}>
                    <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentProfile = profiles[currentIndex];
    const nextProfile = profiles[currentIndex + 1];

    const openProfile = (profile: any) => {
        navigation.navigate('ProfileDetail', { profile, myRouteData: userRoute });
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.cardsContainer}>
                {/* Background Cards (Next Profile) */}
                {nextProfile && (
                    <Animated.View style={[styles.cardWrapper, nextCardStyle]}>
                        <ReanimatedSwipeCard profile={nextProfile} />
                    </Animated.View>
                )}

                {/* Top Card */}
                <GestureDetector gesture={handlePan}>
                    <Animated.View style={[styles.cardWrapper, topCardStyle]}>
                        <ReanimatedSwipeCard profile={currentProfile} onPress={() => openProfile(currentProfile)} />
                    </Animated.View>
                </GestureDetector>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.passButton]}
                    onPress={() => {
                        translateX.value = withTiming(-width * 1.5, { duration: 200 }, () => {
                            runOnJS(onSwipeComplete)('left');
                        });
                    }}
                >
                    <IconSymbol name="xmark" size={30} color="#FF3B30" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.likeButton]}
                    onPress={() => {
                        translateX.value = withTiming(width * 1.5, { duration: 200 }, () => {
                            runOnJS(onSwipeComplete)('right');
                        });
                    }}
                >
                    <IconSymbol name="heart.fill" size={30} color="#34C759" />
                </TouchableOpacity>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5B7FFF', // Updated violet color
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        shadowColor: '#5B7FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    refreshButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 140,
    },
    cardWrapper: {
        position: 'absolute',
        top: 35, // Moved slightly higher
        width: width * 0.90,
        height: height * 0.82, // Increased to avoid clipping taller card
        alignItems: 'center',
        alignSelf: 'center',
    },
    buttonsContainer: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-evenly',
        zIndex: 50,

    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    passButton: {
        // color handled by icon
    },
    likeButton: {
        // color handled by icon
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    emptyStateOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        padding: 20,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 24,
        marginBottom: 30,
    },
    actionBtn: {
        backgroundColor: '#4d73ba',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
