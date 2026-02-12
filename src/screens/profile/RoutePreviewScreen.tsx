import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteMap, Checkpoint } from '@/components/map/RouteMap';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function RoutePreviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // If passed via params, use that. Otherwise fetch current user's route.
        if (route.params?.userId) {
            setUserId(route.params.userId);
            fetchRoute(route.params.userId);
        } else {
            getCurrentUser();
        }
    }, []);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            fetchRoute(user.id);
        }
    };

    const fetchRoute = async (uid: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('route_data')
            .eq('id', uid)
            .single();

        if (data?.route_data) {
            // Ensure type safety
            const routeData = data.route_data as any[];
            if (Array.isArray(routeData)) {
                setCheckpoints(routeData);
            }
        }
    };

    return (
        <View style={styles.container}>
            <RouteMap checkpoints={checkpoints} interactive={true} />

            <SafeAreaView style={styles.overlay}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <IconSymbol name="xmark.circle.fill" size={32} color="#333" />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Trip Route</Text>
                    <Text style={styles.subtitle}>{checkpoints.length} stops</Text>
                </View>
            </SafeAreaView>

            {/* FAB for Edit - Only show if viewing own profile */}
            {/* For now, assume we are viewing own profile if no userId param or if matches current auth user */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('EditRouteScreen', { currentRoute: checkpoints })}
            >
                <IconSymbol name="pencil" size={24} color="#fff" />
                <Text style={styles.fabText}>Edit Route</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    backButton: { marginRight: 15 },
    titleContainer: { backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 12, color: '#666' },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        backgroundColor: '#4d73ba',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 }
});
