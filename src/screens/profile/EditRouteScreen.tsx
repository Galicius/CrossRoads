import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Checkpoint, RouteMap } from '@/components/map/RouteMap';
import { PlaceAutocomplete } from '@/components/ui/PlaceAutocomplete';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Toast } from '@/components/ui/Toast';


export default function EditRouteScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(false);

    // For editing a specific checkpoint's details
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState<{ id: string, type: 'start' | 'end' } | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success'
    });


    useEffect(() => {
        if (route.params?.currentRoute) {
            setCheckpoints(route.params.currentRoute);
        }
    }, []);

    const handleAddPlace = (place: { name: string; lat: number; lng: number }) => {
        const newCheckpoint: Checkpoint = {
            id: Date.now().toString(),
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            durationDays: 1 // Default
        };
        setCheckpoints([...checkpoints, newCheckpoint]);
    };

    const handleRemoveCheckpoint = (id: string) => {
        setCheckpoints(checkpoints.filter(c => c.id !== id));
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newCheckpoints = [...checkpoints];
        [newCheckpoints[index - 1], newCheckpoints[index]] = [newCheckpoints[index], newCheckpoints[index - 1]];
        setCheckpoints(newCheckpoints);
    };

    const handleMoveDown = (index: number) => {
        if (index === checkpoints.length - 1) return;
        const newCheckpoints = [...checkpoints];
        [newCheckpoints[index + 1], newCheckpoints[index]] = [newCheckpoints[index], newCheckpoints[index + 1]];
        setCheckpoints(newCheckpoints);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            console.log("Saving route checkpoints:", JSON.stringify(checkpoints, null, 2));

            const payload: any = {
                route_data: checkpoints,
                // Also update basic location if not empty
                ...(checkpoints.length > 0 ? {
                    latitude: checkpoints[0].lat, // Assuming first point is current location or similar logic needed
                    longitude: checkpoints[0].lng
                } : {})
            };

            const { error } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', user.id);

            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }

            setToast({ visible: true, message: "Route updated successfully!", type: 'success' });
            setTimeout(() => {
                navigation.goBack();
            }, 1000);

        } catch (error: any) {
            console.error("Save error:", error);
            setToast({ visible: true, message: error.message, type: 'error' });

        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentShow = showDatePicker;
        setShowDatePicker(null); // Hide picker immediately

        if (event.type === 'set' && selectedDate && currentShow) {
            // Keep the time but update the date, or just use the selected date as is (UTC/Local issues?)
            // For now, let's just use ISO string of the selected date.
            const dateStr = selectedDate.toISOString();
            console.log("Setting date for", currentShow.id, currentShow.type, dateStr);

            setCheckpoints(prevCheckpoints => prevCheckpoints.map(c => {
                if (c.id === currentShow.id) {
                    return {
                        ...c,
                        [currentShow.type === 'start' ? 'startDate' : 'endDate']: dateStr
                    };
                }
                return c;
            }));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Route</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
                <RouteMap checkpoints={checkpoints} style={StyleSheet.absoluteFill} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.controlsContainer}>
                    <View style={{ zIndex: 1000 }}>
                        <Text style={styles.sectionLabel}>Add a Stop</Text>
                        <PlaceAutocomplete onSelect={handleAddPlace} placeholder="Enter a city to add..." />
                    </View>

                    <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Your Itinerary</Text>
                    <FlatList
                        data={checkpoints}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <View style={styles.checkpointItem}>
                                <View style={styles.orderBadge}>
                                    <Text style={styles.orderText}>{String(index + 1)}</Text>
                                </View>

                                <View style={styles.checkpointInfo}>
                                    <Text style={styles.checkpointName}>{item?.name ? String(item.name) : 'Unknown Place'}</Text>
                                    <View style={styles.dateRow}>
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker({ id: item.id, type: 'start' })}
                                            style={styles.dateButton}
                                        >
                                            <Text style={styles.dateText}>
                                                {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Arr Date'}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: '#ccc' }}> - </Text>
                                        <TouchableOpacity
                                            onPress={() => setShowDatePicker({ id: item.id, type: 'end' })}
                                            style={styles.dateButton}
                                        >
                                            <Text style={styles.dateText}>
                                                {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'Dep Date'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.actions}>
                                    <TouchableOpacity onPress={() => handleMoveUp(index)} style={styles.actionBtn}>
                                        <IconSymbol name="arrow.up" size={16} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleMoveDown(index)} style={styles.actionBtn}>
                                        <IconSymbol name="arrow.down" size={16} color="#666" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleRemoveCheckpoint(item.id)} style={[styles.actionBtn, { backgroundColor: '#ffebee' }]}>
                                        <IconSymbol name="trash" size={16} color="#d32f2f" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 50 }}
                        style={{ flex: 1 }}
                    />
                </View>
            </KeyboardAvoidingView>

            {showDatePicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    cancelText: { fontSize: 16, color: '#666' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    saveText: { fontSize: 16, color: '#4d73ba', fontWeight: 'bold' },

    mapContainer: { height: 250, width: '100%' },

    controlsContainer: { flex: 1, padding: 20 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase' },

    checkpointItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9',
        padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee'
    },
    orderBadge: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#4d73ba',
        alignItems: 'center', justifyContent: 'center', marginRight: 10
    },
    orderText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    checkpointInfo: { flex: 1 },
    checkpointName: { fontSize: 16, fontWeight: '600', color: '#333' },

    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    dateButton: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
    dateText: { fontSize: 12, color: '#666' },

    actions: { flexDirection: 'row', gap: 5 },
    actionBtn: { padding: 8, backgroundColor: '#eee', borderRadius: 8 }
});
