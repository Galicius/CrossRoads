import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { SwipeableCard } from '../../components/dating/SwipeableCard';

const { width, height } = Dimensions.get('window');

// Mock User Path (Me) and Match Path (Them) - Reusing logic but slightly varied for mock data
const generatePath = (startLat: number, startLon: number, steps: number) => {
    const path = [];
    for (let i = 0; i < steps; i++) {
        path.push({
            latitude: startLat + (Math.random() - 0.5) * 0.1,
            longitude: startLon + (Math.random() - 0.5) * 0.1,
        });
    }
    return path;
};

// Mock Profiles
const MOCK_PROFILES = [
    {
        id: '1',
        name: 'Alex',
        age: 31,
        bio: 'Heading North. Love hiking and photography.',
        distance: 'Nearby intersection!',
        images: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        ],
        myPath: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 36.6002, longitude: -121.8947 },
            { latitude: 34.4208, longitude: -119.6982 },
        ],
        matchPath: [
            { latitude: 36.1699, longitude: -115.1398 },
            { latitude: 34.0522, longitude: -118.2437 },
            { latitude: 34.4208, longitude: -119.6982 },
        ],
        meetPoint: { latitude: 34.4208, longitude: -119.6982 },
    },
    {
        id: '2',
        name: 'Sarah',
        age: 28,
        bio: 'Van living across the coast. Coffee addict ☕️',
        distance: '5 miles away',
        images: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
        ],
        myPath: [
            { latitude: 40.7128, longitude: -74.0060 },
            { latitude: 39.9526, longitude: -75.1652 },
        ],
        matchPath: [
            { latitude: 38.9072, longitude: -77.0369 },
            { latitude: 39.9526, longitude: -75.1652 },
        ],
        meetPoint: { latitude: 39.9526, longitude: -75.1652 },
    },
    {
        id: '3',
        name: 'Mike',
        age: 35,
        bio: 'Just looking for good vibes and better views.',
        distance: '12 miles away',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        ],
        myPath: [
            { latitude: 34.0522, longitude: -118.2437 },
            { latitude: 33.6846, longitude: -117.8265 },
        ],
        matchPath: [
            { latitude: 32.7157, longitude: -117.1611 },
            { latitude: 33.6846, longitude: -117.8265 },
        ],
        meetPoint: { latitude: 33.6846, longitude: -117.8265 },
    },
];

export default function DatingDiscoverScreen() {
    const swiperRef = useRef<Swiper<any>>(null);
    const [cardIndex, setCardIndex] = useState(0);
    const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);

    const onSwiped = (index: number) => {
        setCardIndex(index + 1);
        setIsSwipeEnabled(true); // Reset swipe on new card
    };

    const renderCard = (card: any) => {
        if (!card) return null; // Handle case where cards run out
        return (
            <SwipeableCard
                profile={card}
                onPass={() => swiperRef.current?.swipeLeft()}
                onMatch={() => swiperRef.current?.swipeRight()}
                onExpandChange={(expanded) => setIsSwipeEnabled(!expanded)}
            />
        );
    };

    const renderOverlayLabel = (label: string, color: string) => (
        <View style={[styles.overlayLabel, { borderColor: color }]}>
            <Text style={[styles.overlayLabelText, { color }]}>{label}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.swiperContainer}>
                <Swiper
                    ref={swiperRef}
                    cards={MOCK_PROFILES}
                    renderCard={renderCard}
                    onSwiped={onSwiped}
                    onSwipedLeft={(index) => console.log('Passed', MOCK_PROFILES[index]?.name)}
                    onSwipedRight={(index) => console.log('Matched', MOCK_PROFILES[index]?.name)}
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
            {cardIndex >= MOCK_PROFILES.length && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No more profiles nearby!</Text>
                    <TouchableOpacity onPress={() => { setCardIndex(0); swiperRef.current?.jumpToCardIndex(0); }}>
                        <Text style={{ color: '#4A90E2', marginTop: 20 }}>Reset (Demo)</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
