
import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';
import { DetailCarousel } from './DetailCarousel';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

// Since we are using react-native-deck-swiper or similar, this component might just be the "Card Content".
// The swiping logic is handled by the DeckSwiper component in the parent.
// However, we need to handle the "Expand" logic.

const { width, height } = Dimensions.get('window');

interface ProfileData {
    id: string;
    name: string;
    age: number;
    bio: string;
    distance: string;
    images: string[];
    myPath: any[];
    matchPath: any[];
    meetPoint: any;
}

interface SwipeableCardProps {
    profile: ProfileData;
    onPass: () => void;
    onMatch: () => void;
    onExpandChange?: (expanded: boolean) => void;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({ profile, onPass, onMatch, onExpandChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        onExpandChange?.(newState);
        console.log("Expanding card:", newState);
    };

    return (
        <View style={[styles.card, isExpanded ? styles.expandedCard : {}]}>
            <View style={styles.carouselContainer}>
                <DetailCarousel
                    images={profile.images}
                    myPath={profile.myPath}
                    matchPath={profile.matchPath}
                    meetPoint={profile.meetPoint}
                    onExpand={toggleExpand}
                    isExpanded={isExpanded}
                />
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.header}>
                    <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                    <Text style={styles.distance}>{profile.distance}</Text>
                </View>
                <Text style={styles.bio} numberOfLines={isExpanded ? 0 : 2}>{profile.bio}</Text>

                {/* Only show actions if expanded or maybe always? 
                     Usually in Tinder, actions are always visible below or overlaid. 
                     If we are in "Deck" mode, the actions might be buttons outside the card or gestures.
                     Let's keep them here for now as part of the card content.
                 */}
                <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, styles.pass]} onPress={onPass}>
                        <Text>Pass</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.like]} onPress={onMatch}>
                        <Text style={styles.likeText}>Connect</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        height: height * 0.70, // Fixed height for deck card - subtly smaller
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 20
    },
    expandedCard: {
        // height: height * 0.85, // Maybe grow a bit?
    },
    carouselContainer: {
        flex: 4, // Takes up most space
    },
    infoContainer: {
        flex: 1.5,
        padding: 20,
        justifyContent: 'space-between'
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    name: { fontSize: 24, fontWeight: 'bold' },
    distance: { color: '#4A90E2', fontWeight: '600' },
    bio: { fontSize: 16, color: 'gray' },
    actions: { flexDirection: 'row', gap: 15, marginTop: 10 },
    button: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    pass: { backgroundColor: '#eee' },
    like: { backgroundColor: '#FF6B6B' },
    likeText: { color: 'white', fontWeight: 'bold' },
});
