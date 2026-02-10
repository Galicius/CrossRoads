import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { IconSymbol } from '@/components/ui/IconSymbol';

// ... (interfaces stay same)

// ...

const styles = StyleSheet.create({
    map: { flex: 1 },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    markerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#5659ab',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
    },
    markerNumber: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    durationBadge: {
        position: 'absolute',
        top: -15,
        right: -25, // Offset more to right to accommodate larger size
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
        minWidth: 24, // Ensure minimum width
        alignItems: 'center'
    },
    durationText: { fontSize: 12, fontWeight: '800', color: '#5659ab' },

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

    vehicleMarker: {
        backgroundColor: '#5659ab',
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3
    }
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
    interactive?: boolean;
    onMarkerPress?: (checkpoint: Checkpoint) => void;
    style?: any;
}

export function RouteMap({ checkpoints, interactive = false, onMarkerPress, style }: RouteMapProps) {
    const mapRef = useRef<MapView>(null);

    const [routeCoordinates, setRouteCoordinates] = React.useState<{ latitude: number, longitude: number }[]>([]);

    useEffect(() => {
        if (checkpoints.length > 1) {
            // Optimistic update: show straight lines first
            const straightLines = checkpoints.map(c => ({ latitude: c.lat, longitude: c.lng }));
            setRouteCoordinates(straightLines);

            // Fetch actual route
            fetchRoute(checkpoints);
        } else {
            setRouteCoordinates([]);
        }

        if (checkpoints.length > 0 && mapRef.current) {
            const coordinates = checkpoints.map(c => ({ latitude: c.lat, longitude: c.lng }));
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [checkpoints]);

    const fetchRoute = async (points: Checkpoint[]) => {
        try {
            // OSRM Public API (Project-OSRM.org)
            // Note: This is a demo server with limits. For production, host your own OSRM or use a different provider.
            const coordinatesString = points.map(p => `${p.lng},${p.lat}`).join(';');
            const url = `http://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const geometry = data.routes[0].geometry;
                if (geometry.type === 'LineString') {
                    // Convert GeoJSON [lon, lat] to { latitude, longitude }
                    const path = geometry.coordinates.map((coord: number[]) => ({
                        latitude: coord[1],
                        longitude: coord[0]
                    }));
                    setRouteCoordinates(path);
                }
            }
        } catch (error) {
            console.warn("Error fetching route:", error);
            // Fallback is already set (straight lines)
        }
    };

    // Fallback coordinates for polyline if route fetch fails (use checkpoints directly)
    // But we are setting routeCoordinates state now.

    return (
        <MapView
            ref={mapRef}
            style={[styles.map, style]}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
                latitude: 46.0569,
                longitude: 14.5058,
                latitudeDelta: 5.0,
                longitudeDelta: 5.0,
            }}
            customMapStyle={mapStyle}
        >
            {checkpoints.length > 1 && (
                <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#5659ab"
                    strokeWidth={4}
                />
            )}

            {checkpoints.map((checkpoint, index) => {
                const start = checkpoint.startDate ? new Date(checkpoint.startDate) : null;
                const end = checkpoint.endDate ? new Date(checkpoint.endDate) : null;
                let duration = 0;
                if (start && end) {
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return (
                    <Marker
                        key={checkpoint.id}
                        coordinate={{ latitude: checkpoint.lat, longitude: checkpoint.lng }}
                        onPress={() => onMarkerPress && onMarkerPress(checkpoint)}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerDot}>
                                {/* Re-enabling text carefully */}
                                {/* <Text style={styles.markerNumber}>{String(index + 1)}</Text> */}
                            </View>

                            {/* Duration Badge */}
                            {duration > 0 && (
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>{String(duration)}d</Text>
                                </View>
                            )}

                            <Callout tooltip>
                                <View style={styles.callout}>
                                    <Text style={styles.calloutTitle}>{String(checkpoint.name)}</Text>
                                    {start && end && (
                                        <Text style={styles.calloutText}>
                                            {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Text>
                                    )}
                                </View>
                            </Callout>
                        </View>
                    </Marker>
                )
            })}

            {(() => {
                const now = new Date();
                let vehiclePosition = null;

                if (checkpoints.length > 0) {
                    const c = checkpoints;
                    const firstCheckpoint = c[0];
                    const firstStart = firstCheckpoint?.startDate ? new Date(firstCheckpoint.startDate) : null;

                    const lastCheckpoint = c[c.length - 1];
                    const lastEnd = lastCheckpoint?.endDate ? new Date(lastCheckpoint.endDate) : null;

                    if (firstStart && now < firstStart) {
                        vehiclePosition = { latitude: c[0].lat, longitude: c[0].lng };
                    } else if (lastEnd && now > lastEnd) {
                        vehiclePosition = { latitude: c[c.length - 1].lat, longitude: c[c.length - 1].lng };
                    } else {
                        for (let i = 0; i < c.length; i++) {
                            const curr = c[i];
                            const start = curr.startDate ? new Date(curr.startDate) : null;
                            const end = curr.endDate ? new Date(curr.endDate) : null;

                            if (start && end && now >= start && now <= end) {
                                vehiclePosition = { latitude: curr.lat, longitude: curr.lng };
                                break;
                            }

                            const next = c[i + 1];
                            if (next) {
                                const nextStart = next.startDate ? new Date(next.startDate) : null;
                                if (end && nextStart && now > end && now < nextStart) {
                                    const totalTime = nextStart.getTime() - end.getTime();
                                    const elapsed = now.getTime() - end.getTime();
                                    const progress = elapsed / totalTime;
                                    const lat = curr.lat + (next.lat - curr.lat) * progress;
                                    const lng = curr.lng + (next.lng - curr.lng) * progress;
                                    vehiclePosition = { latitude: lat, longitude: lng };
                                    break;
                                }
                            }
                        }
                    }
                }

                if (vehiclePosition) {
                    return (
                        <Marker
                            coordinate={vehiclePosition}
                            anchor={{ x: 0.5, y: 0.5 }}
                            zIndex={100}
                        >
                            <View style={styles.vehicleMarker}>
                                <IconSymbol name="car.fill" size={24} color="white" />
                            </View>
                        </Marker>
                    );
                }
                return null;
            })()}
        </MapView>
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
