import React, { useRef, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { SwipeableCard } from '../../components/dating/SwipeableCard';
import { supabase } from '../../lib/supabase';
import { useRevenueCat } from '../../context/RevenueCatContext';

const { width, height } = Dimensions.get('window');

// Mock path generator kept for visual demo if real location data is missing
const generatePath = (startLat: number, startLon: number, steps: number) => {
    const path = [];
    if (!startLat || !startLon) return [];
    for (let i = 0; i < steps; i++) {
        path.push({
            latitude: startLat + (Math.random() - 0.5) * 0.1,
            longitude: startLon + (Math.random() - 0.5) * 0.1,
        });
    }
    return path;
};

export default function DatingDiscoverScreen() {
    const navigation = useNavigation<any>();
    const swiperRef = useRef<Swiper<any>>(null);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cardIndex, setCardIndex] = useState(0);
    const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const { isPro } = useRevenueCat();
    const [swipesToday, setSwipesToday] = useState(0);

    useEffect(() => {
        loadProfiles(false);
    }, []);

    const loadProfiles = async (isPagination = false) => {
        if (loading) return; // Prevent duplicate calls
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log("No user logged in");
                setLoading(false);
                return;
            }
            if (!currentUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                setCurrentUser(profile || user); // Fallback to auth user if profile missing
            }

            // 1. Get IDs of users already swiped
            const { data: swipes } = await supabase
                .from('swipes')
                .select('swipee_id')
                .eq('swiper_id', user.id);

            const swipedIds = swipes?.map(s => s.swipee_id) || [];

            // Also exclude currently loaded profiles to avoid duplicates
            const currentProfileIds = profiles.map(p => p.id);
            const excludeIds = [...swipedIds, ...currentProfileIds];

            // 2. Fetch profiles excluding self, swiped, and already loaded
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id); // Exclude self

            if (excludeIds.length > 0) {
                // Use .filter with 'not.in' operator for robust exclusion
                const filterString = `(${excludeIds.map(id => `"${id}"`).join(',')})`;
                query = query.filter('id', 'not.in', filterString);
            }


            const { data, error } = await query.limit(10); // Fetch smaller batches

            if (error) throw error;

            console.log(`Fetch debug (Pagination: ${isPagination}): Found ${data?.length} profiles`);

            // Transform data
            const formattedProfiles = (data as any[])?.map(p => ({
                id: p.id,
                name: p.full_name || p.username || 'Anonymous',
                age: p.age || 25,
                bio: p.bio || 'No bio yet.',
                images: p.images && p.images.length > 0 ? p.images : ['https://via.placeholder.com/400x600?text=No+Image'],
                distance: 'Nearby',
                myPath: p.route_data ? p.route_data : generatePath(p.latitude || 37.7, p.longitude || -122.4, 3),
                matchPath: currentUser?.route_data ? currentUser.route_data : generatePath(37.7, -122.4, 3),
                meetPoint: { latitude: p.latitude || 37.7, longitude: p.longitude || -122.4 }
            })) || [];


            if (isPagination) {
                setProfiles(prev => [...prev, ...formattedProfiles]);
            } else {
                setProfiles(formattedProfiles);
                checkSwipeCount(user.id);
            }

        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkSwipeCount = async (userId: string) => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from('swipes')
            .select('*', { count: 'exact', head: true })
            .eq('swiper_id', userId)
            .gte('created_at', startOfDay.toISOString());

        if (count !== null) {
            setSwipesToday(count);
            if (!isPro && count >= 10) {
                setIsSwipeEnabled(false); // Disable initially if limit reached
            }
        }
    };

    const handleSwipe = async (cardIndex: number, liked: boolean) => {
        if (!isPro && swipesToday >= 10) return; // Block API call if limit reached
        if (!profiles[cardIndex] || !currentUser) return;

        const swipeeId = profiles[cardIndex].id;

        try {
            const { data, error } = await supabase.rpc('handle_swipe', {
                p_swiper_id: currentUser.id,
                p_swipee_id: swipeeId,
                p_liked: liked
            });

            if (error) {
                console.error('Swipe error:', error);
                return;
            }

            if (data && (data as any).match) {
                Alert.alert("It's a Match!", `You matched with ${profiles[cardIndex].name}!`, [
                    { text: 'Keep Swiping', style: 'cancel' },
                    {
                        text: 'Send Message',
                        onPress: () => navigation.navigate('ChatDetail', {
                            chatId: (data as any).chat_id,
                            otherUserName: profiles[cardIndex].name
                        })
                    }
                ]);
            }

        } catch (err) {
            console.error('Swipe exception:', err);
        }
    };

    const onSwiped = (index: number) => {
        const newCount = swipesToday + 1;
        setSwipesToday(newCount);

        if (!isPro && newCount >= 10) {
            setIsSwipeEnabled(false);
            Alert.alert("Daily Limit Reached", "Upgrade to Pro to continue swiping!", [
                { text: "Cancel", style: "cancel" },
                { text: "Upgrade", onPress: () => navigation.navigate('Paywall') }
            ]);
        } else {
            setIsSwipeEnabled(true);
        }


        setCardIndex(index + 1);

        // Pagination: Fetch more if nearing end (e.g., 5 cards left)
        if (profiles.length - index < 5 && !loading) {
            loadProfiles(true);
        }
    };

    const renderCard = (card: any) => {
        if (!card) return null;
        return (
            <SwipeableCard
                profile={card}
                onPass={() => swiperRef.current?.swipeLeft()}
                onMatch={() => swiperRef.current?.swipeRight()}
                onExpandChange={(expanded) => setIsSwipeEnabled(!expanded)}
            />
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (profiles.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No more profiles nearby!</Text>
                    <TouchableOpacity onPress={() => loadProfiles(false)}>
                        <Text style={{ color: '#4A90E2', marginTop: 20 }}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.swiperContainer}>
                <Swiper
                    ref={swiperRef}
                    cards={profiles}
                    renderCard={renderCard}
                    onSwiped={onSwiped}
                    onSwipedLeft={(index) => handleSwipe(index, false)}
                    onSwipedRight={(index) => handleSwipe(index, true)}
                    cardIndex={cardIndex}
                    stackSize={3}
                    stackScale={10}
                    stackSeparation={14}
                    disableTopSwipe
                    disableBottomSwipe
                    horizontalSwipe={isSwipeEnabled}
                    animateOverlayLabelsOpacity
                    animateCardOpacity
                    backgroundColor={'transparent'}
                    containerStyle={{ backgroundColor: 'transparent' }}
                    overlayLabels={{
                        left: {
                            title: 'NOPE',
                            style: {
                                label: {
                                    backgroundColor: 'black',
                                    borderColor: 'black',
                                    color: 'white',
                                    borderWidth: 1
                                },
                                wrapper: {
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    justifyContent: 'flex-start',
                                    marginTop: 30,
                                    marginLeft: -30
                                }
                            }
                        },
                        right: {
                            title: 'LIKE',
                            style: {
                                label: {
                                    backgroundColor: 'black',
                                    borderColor: 'black',
                                    color: 'white',
                                    borderWidth: 1
                                },
                                wrapper: {
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-start',
                                    marginTop: 30,
                                    marginLeft: 30
                                }
                            }
                        }
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    swiperContainer: {
        flex: 1,
    },
    overlayLabel: {
        borderWidth: 4,
        borderRadius: 10,
        padding: 10,
        margin: 40,
        transform: [{ rotate: '-15deg' }],
    },
    overlayLabelText: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
});
