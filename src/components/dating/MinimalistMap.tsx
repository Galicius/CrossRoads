
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, withRepeat } from 'react-native-reanimated';

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface MinimalistMapProps {
    myPath: Coordinate[];
    matchPath: Coordinate[];
    meetPoint: Coordinate;
}

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

// Minimalist Map Style (Hide POIs, Roads only)
const mapStyle = [
    {
        "featureType": "all",
        "elementType": "labels",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "landscape",
        "stylers": [{ "color": "#f5f5f5" }]
    },
    {
        "featureType": "poi",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }, { "lightness": 100 }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#dedede" }, { "lightness": 17 }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }]
    }
];

export const MinimalistMap: React.FC<MinimalistMapProps> = ({ myPath, matchPath, meetPoint }) => {
    // Animation for "drawing" the path is tricky with Polyline strokeWidth/Length directly since library limitations.
    // Instead, we can animate Opacity or just a simple stroke width pulse.
    // A common trick is to render only a subset of coordinates over time, but that requires state updates which might be slow.

    // For simplicity and performance, we'll pulse the stroke width or color.
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        strokeWidth: 3 + progress.value * 2, // Pulse width between 3 and 5
    }));

    // Re-calculate region to fit both paths roughly
    const allCoords = [...myPath, ...matchPath];
    const minLat = Math.min(...allCoords.map(c => c.latitude));
    const maxLat = Math.max(...allCoords.map(c => c.latitude));
    const minLon = Math.min(...allCoords.map(c => c.longitude));
    const maxLon = Math.max(...allCoords.map(c => c.longitude));

    const initialRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5,
        longitudeDelta: (maxLon - minLon) * 1.5,
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                customMapStyle={mapStyle}
                initialRegion={initialRegion}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                <Polyline
                    coordinates={myPath}
                    strokeColor="#4A90E2"
                    strokeWidth={4}
                />
                <Polyline
                    coordinates={matchPath}
                    strokeColor="#FF6B6B"
                    strokeWidth={4}
                />

                <Marker coordinate={meetPoint}>
                    <View style={styles.pingContainer}>
                        <View style={styles.pingCore} />
                    </View>
                </Marker>
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    pingContainer: { alignItems: 'center', justifyContent: 'center', width: 20, height: 20 },
    pingCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFD700', borderWidth: 2, borderColor: 'white' },
});
