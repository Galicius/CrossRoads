import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DetailCarousel } from './DetailCarousel';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

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
    };

    return (
        <View style={[styles.card, isExpanded ? styles.expandedCard : {}]}>
            {/* Full-size Image/Carousel */}
            <View style={styles.imageBackground}>
                <DetailCarousel
                    images={profile.images}
                    myPath={profile.myPath}
                    matchPath={profile.matchPath}
                    meetPoint={profile.meetPoint}
                    onExpand={toggleExpand}
                    isExpanded={isExpanded}
                />
            </View>

            {/* Content Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                style={styles.overlayGradient}
            >
                <View style={styles.infoContainer}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                        <Text style={styles.landlover}>Landlover</Text>
                    </View>
                    <Text style={styles.bio} numberOfLines={isExpanded ? 0 : 3}>
                        "{profile.bio}"
                    </Text>

                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.button, styles.pass]} onPress={onPass}>
                            <Text style={styles.actionText}>Pass</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.like]} onPress={onMatch}>
                            <Text style={styles.likeText}>Connect</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        height: height * 0.35,
        width: width * 0.9,
        alignSelf: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
        marginBottom: 20
    },
    expandedCard: {
        height: height * 0.55,
    },
    imageBackground: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
    },
    overlayGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 60, // Grant space for gradient fade
        paddingBottom: 20,
        paddingHorizontal: 20,
        justifyContent: 'flex-end',
    },
    infoContainer: {
        // Removed padding/flex here as it's handled by gradient container
    },
    header: {
        marginBottom: 8
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2
    },
    landlover: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4
    },
    bio: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 20,
        fontStyle: 'italic',
        lineHeight: 20
    },
    actions: {
        flexDirection: 'row',
        gap: 15
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 30, // Rounder buttons
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)', // Glassmorphic button
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    pass: {
        // backgroundColor: 'rgba(255, 59, 48, 0.2)', // Red tint? or just glass
        // borderColor: 'rgba(255, 59, 48, 0.5)' 
    },
    like: {
        // backgroundColor: 'rgba(52, 199, 89, 0.2)', // Green tint?
        // borderColor: 'rgba(52, 199, 89, 0.5)'
        backgroundColor: 'white', // Keep connect prominent? Or style as per image (looks like just text in image, but user said keep buttons)
        // Let's make "Connect" solid white for contrast if "Pass" is glass
    },
    actionText: {
        color: 'white',
        fontWeight: '600'
    },
    likeText: {
        color: '#333',
        fontWeight: 'bold'
    },
});
