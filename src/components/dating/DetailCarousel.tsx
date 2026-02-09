
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableWithoutFeedback, Text } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { MinimalistMap } from './MinimalistMap';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface DetailCarouselProps {
    images: string[];
    myPath: any[];
    matchPath: any[];
    meetPoint: any;
    onExpand: () => void;
    isExpanded: boolean;
    profile: {
        name: string;
        age: number;
        bio: string;
        distance?: string;
    };
}

const { width } = Dimensions.get('window');

export const DetailCarousel: React.FC<DetailCarouselProps> = ({
    images, myPath, matchPath, meetPoint, onExpand, isExpanded, profile
}) => {
    // Pages: [Main Image, Map, ...Rest Images]
    const data = [
        { type: 'image', uri: images[0] },
        { type: 'map' },
        ...images.slice(1).map(uri => ({ type: 'image', uri }))
    ];

    const renderItem = ({ item, index }: { item: any; index: number }) => {
        if (item.type === 'image') {
            return (
                <TouchableWithoutFeedback onPress={onExpand}>
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />

                        {/* Gradient Overlay - darker at bottom */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                            style={styles.gradient}
                        />

                        {/* Profile Info Overlay */}
                        {!isExpanded && index === 0 && (
                            <View style={styles.profileOverlay}>
                                <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
                                {profile.distance && (
                                    <Text style={styles.profileDistance}>{profile.distance}</Text>
                                )}
                                <Text style={styles.profileBio} numberOfLines={3}>{profile.bio}</Text>
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            );
        } else if (item.type === 'map') {
            return (
                <View style={styles.mapContainer}>
                    <MinimalistMap myPath={myPath} matchPath={matchPath} meetPoint={meetPoint} />
                </View>
            );
        }
        return <View />;
    };

    return (
        <View style={styles.container}>
            <Carousel
                loop={false}
                width={width - 40} // Card width approx
                height={isExpanded ? 500 : 400} // Dynamic height? Or fixed for now
                autoPlay={false}
                data={data}
                scrollAnimationDuration={1000}
                renderItem={renderItem}
                enabled={isExpanded} // Only swipe carousel when expanded? Or always?
            // If not expanded, maybe disable swipe so outer card can be swiped?
            // Actually, if we touch the carousel area, `react-native-deck-swiper` might not pick up the pan.
            // We usually need the outer swiper to handle the gesture unless we are in "detail" mode.
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
        backgroundColor: '#eee',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
    mapContainer: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    profileOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    profileName: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    profileDistance: {
        color: 'white',
        fontSize: 14,
        marginBottom: 8,
        opacity: 0.9,
    },
    profileBio: {
        color: 'white',
        fontSize: 15,
        lineHeight: 20,
        opacity: 0.95,
    },
    overlay: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    tapHint: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    }
});
