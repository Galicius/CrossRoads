
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
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

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

export default function DatingScreenV2() {
    const navigation = useNavigation<any>();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
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

            // Get already-swiped IDs
            const { data: swipes } = await supabase
                .from('swipes')
                .select('swipee_id')
                .eq('swiper_id', user.id);
            const swipedIds = swipes?.map(s => s.swipee_id) || [];

            // Fetch profiles excluding self and already swiped
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id);

            if (swipedIds.length > 0) {
                const filterString = `(${swipedIds.map(id => `"${id}"`).join(',')})`;
                query = query.filter('id', 'not.in', filterString);
            }

            const { data, error } = await query.limit(20);
            if (error) throw error;

            const formatted = data?.map(p => ({
                id: p.id,
                name: p.full_name || p.username || 'Anonymous',
                age: p.age || 25,
                bio: p.bio || 'No bio yet.',
                images: p.images && p.images.length > 0 ? p.images : ['https://via.placeholder.com/400x800'],
                distance: 'Nearby',
                route_data: p.route_data || [],
            })) || [];

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
            <View style={styles.center}>
                <Text>No more profiles!</Text>
                <TouchableOpacity onPress={loadProfiles}>
                    <Text style={{ color: 'blue', marginTop: 10 }}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentProfile = profiles[currentIndex];
    const nextProfile = profiles[currentIndex + 1];

    const openProfile = (profile: any) => {
        navigation.navigate('ProfileDetail', { profile });
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
        backgroundColor: '#F2F2F7',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrapper: {
        position: 'absolute',
        top: 60, // Safe area ish
        width: width,
        alignItems: 'center',
    },
    buttonsContainer: {
        position: 'absolute',
        bottom: 50,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-evenly',
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
});
