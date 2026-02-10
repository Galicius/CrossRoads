
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableWithoutFeedback, Text } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { MinimalistMap } from './MinimalistMap';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

interface DetailCarouselProps {
    images: string[];
    myPath: any[];
    matchPath: any[];
    meetPoint: any;
    onExpand: () => void;
    isExpanded: boolean;
    width?: number;
    height?: number;
}

const window = Dimensions.get('window');

export const DetailCarousel: React.FC<DetailCarouselProps> = ({
    images, myPath, matchPath, meetPoint, onExpand, isExpanded,
    width = window.width * 0.9, // Default to card width
    height = window.height * 0.65 // Default to card height
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
                        {/* Overlay moved to parent SwipeableCard for consistent look */}
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
                width={width}
                height={height}
                autoPlay={false}
                data={data}
                scrollAnimationDuration={1000}
                renderItem={renderItem}
                enabled={isExpanded}
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
    mapContainer: {
        flex: 1,
        backgroundColor: '#f0f0f0',
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
