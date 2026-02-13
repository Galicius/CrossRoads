import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';

// ... (interfaces stay same)

// ...

const PRIMARY_COLOR = '#4d73ba';
const SECONDARY_COLOR = '#e8853d';

const styles = StyleSheet.create({
    map: { flex: 1 },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    markerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: PRIMARY_COLOR,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    secondaryMarkerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: SECONDARY_COLOR,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    callout: {
        backgroundColor: 'white',
        padding: 8,
        borderRadius: 8,
        width: 120,
        elevation: 5,
        alignItems: 'center',
        marginBottom: 5
    },
    calloutTitle: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 2, textAlign: 'center' },
    calloutText: { fontSize: 10, color: '#666', textAlign: 'center' },
    legendContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 10,
        padding: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
});

export interface Checkpoint {
    id: string;
    name: string;
    lat: number;
    lng: number;
    startDate?: string;
    endDate?: string;
    durationDays?: number;
}

interface RouteMapProps {
    checkpoints: Checkpoint[];
    /** Optional second route to overlay (shown in a different color) */
    secondaryCheckpoints?: Checkpoint[];
    /** Labels for the legend when two routes are shown */
    primaryLabel?: string;
    secondaryLabel?: string;
    interactive?: boolean;
    onMarkerPress?: (checkpoint: Checkpoint) => void;
    style?: any;
}

export function RouteMap({
    checkpoints,
    secondaryCheckpoints,
    primaryLabel = 'Their route',
    secondaryLabel = 'My route',
    interactive = false,
    onMarkerPress,
    style,
}: RouteMapProps) {
    const mapRef = useRef<MapView>(null);

    const [routeCoordinates, setRouteCoordinates] = React.useState<{ latitude: number, longitude: number }[]>([]);
    const [secondaryRouteCoordinates, setSecondaryRouteCoordinates] = React.useState<{ latitude: number, longitude: number }[]>([]);

    useEffect(() => {
        if (checkpoints.length > 1) {
            const straightLines = checkpoints.map(c => ({ latitude: c.lat, longitude: c.lng }));
            setRouteCoordinates(straightLines);
            fetchRoute(checkpoints, setRouteCoordinates);
        } else {
            setRouteCoordinates([]);
        }

        // Fit map to show all points from both routes
        const allCoords = [
            ...checkpoints.map(c => ({ latitude: c.lat, longitude: c.lng })),
            ...(secondaryCheckpoints || []).map(c => ({ latitude: c.lat, longitude: c.lng })),
        ];
        if (allCoords.length > 0 && mapRef.current) {
            mapRef.current.fitToCoordinates(allCoords, {
                edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
                animated: true,
            });
        }
    }, [checkpoints]);

    // Fetch secondary route
    useEffect(() => {
        if (secondaryCheckpoints && secondaryCheckpoints.length > 1) {
            const straightLines = secondaryCheckpoints.map(c => ({ latitude: c.lat, longitude: c.lng }));
            setSecondaryRouteCoordinates(straightLines);
            fetchRoute(secondaryCheckpoints, setSecondaryRouteCoordinates);
        } else {
            setSecondaryRouteCoordinates([]);
        }
    }, [secondaryCheckpoints]);

    const fetchRoute = async (
        points: Checkpoint[],
        setter: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number }[]>>,
    ) => {
        try {
            const coordinatesString = points.map(p => `${p.lng},${p.lat}`).join(';');
            const url = `http://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const geometry = data.routes[0].geometry;
                if (geometry.type === 'LineString') {
                    const path = geometry.coordinates.map((coord: number[]) => ({
                        latitude: coord[1],
                        longitude: coord[0]
                    }));
                    setter(path);
                }
            }
        } catch (error) {
            console.warn("Error fetching route:", error);
        }
    };

    return (
        <View style={[{ flex: 1 }, style]}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: 46.0569,
                    longitude: 14.5058,
                    latitudeDelta: 5.0,
                    longitudeDelta: 5.0,
                }}
                customMapStyle={mapStyle}
            >
                {/* Primary route */}
                {checkpoints.length > 1 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={PRIMARY_COLOR}
                        strokeWidth={4}
                    />
                )}

                {checkpoints.map((checkpoint) => (
                    <Marker
                        key={`primary-${checkpoint.id}`}
                        coordinate={{ latitude: checkpoint.lat, longitude: checkpoint.lng }}
                        onPress={() => onMarkerPress && onMarkerPress(checkpoint)}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerDot} />

                            <Callout tooltip>
                                <View style={styles.callout}>
                                    <Text style={styles.calloutTitle}>{String(checkpoint.name)}</Text>
                                </View>
                            </Callout>
                        </View>
                    </Marker>
                ))}

                {/* Secondary route (e.g. current user's route) */}
                {secondaryCheckpoints && secondaryCheckpoints.length > 1 && (
                    <Polyline
                        coordinates={secondaryRouteCoordinates}
                        strokeColor={SECONDARY_COLOR}
                        strokeWidth={4}
                        lineDashPattern={[8, 4]}
                    />
                )}

                {secondaryCheckpoints && secondaryCheckpoints.map((checkpoint) => (
                    <Marker
                        key={`secondary-${checkpoint.id}`}
                        coordinate={{ latitude: checkpoint.lat, longitude: checkpoint.lng }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.secondaryMarkerDot} />

                            <Callout tooltip>
                                <View style={styles.callout}>
                                    <Text style={styles.calloutTitle}>{String(checkpoint.name)}</Text>
                                </View>
                            </Callout>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Legend when two routes are shown */}
            {secondaryCheckpoints && secondaryCheckpoints.length > 0 && (
                <View style={styles.legendContainer}>
                    <View style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: PRIMARY_COLOR }]} />
                        <Text style={styles.legendText}>{primaryLabel}</Text>
                    </View>
                    <View style={[styles.legendRow, { marginBottom: 0 }]}>
                        <View style={[styles.legendDot, { backgroundColor: SECONDARY_COLOR }]} />
                        <Text style={styles.legendText}>{secondaryLabel}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}



// Minimalistic Map Style (Hides unnecessary POIs)
const mapStyle = [
    {
        "featureType": "poi",
        "elementType": "labels.text",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "poi.business",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "transit",
        "stylers": [{ "visibility": "off" }]
    }
];
