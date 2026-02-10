import React, { useRef, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { SwipeableCard } from '../../components/dating/SwipeableCard';
import { supabase } from '../../lib/supabase';

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

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Handle not logged in - maybe redirect or show auth screen
                console.log("No user logged in");
                setLoading(false);
                return;
            }
            setCurrentUser(user);

            // 1. Get IDs of users already swiped
            const { data: swipes } = await supabase
                .from('swipes')
                .select('swipee_id')
                .eq('swiper_id', user.id);

            const swipedIds = swipes?.map(s => s.swipee_id) || [];

            // 2. Fetch profiles excluding self and swiped, ensuring they have basic info
            let query = supabase
                .from('profiles')
                .select('*')
                .neq('id', user.id); // Exclude self

            if (swipedIds.length > 0) {
                // .not('id', 'in', `(${swipedIds.join(',')})`) // 'in' expects array/list, typical generic way:
                // Supabase JS .in() filter doesn't support NOT IN directly easily in one chain sometimes?
                // Actually .not('id', 'in', '(' + swipedIds.join(',') + ')') is tricky.
                // Better: Filter in memory or use .filter('id', 'not.in', `(${swipedIds.join(',')})`)
                // The safest is .not('id', 'in', `(${swipedIds.join(',')})`)
                // Note: Supabase JS filter syntax: .not('column', 'operator', value)
                query = query.not('id', 'in', `(${swipedIds.map(id => `"${id}"`).join(',')})`);
            }

            const { data, error } = await query.limit(20);

            if (error) throw error;

            // Transform data if needed to match SwipeableCard expectations
            // The card expects: id, name, age, bio, images[], distance, myPath, matchPath, meetPoint
            const formattedProfiles = (data as any[])?.map(p => ({
                id: p.id,
                name: p.full_name || p.username || 'Anonymous', // Fallback
                age: p.age || 25,
                bio: p.bio || 'No bio yet.',
                images: p.images && p.images.length > 0 ? p.images : ['https://via.placeholder.com/400x600?text=No+Image'],
                distance: 'Nearby', // scalable logic needed for real distance
                // Mocking visual path data for now as DB might not have history
                myPath: generatePath(p.latitude || 37.7, p.longitude || -122.4, 3),
                matchPath: generatePath(37.7, -122.4, 3),
                meetPoint: { latitude: p.latitude || 37.7, longitude: p.longitude || -122.4 }
            })) || [];

            setProfiles(formattedProfiles);

        } catch (error) {
            console.error('Error loading profiles:', error);
            Alert.alert('Error', 'Failed to load profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleSwipe = async (cardIndex: number, liked: boolean) => {
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
        setCardIndex(index + 1);
        setIsSwipeEnabled(true);
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
                    <TouchableOpacity onPress={loadProfiles}>
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
