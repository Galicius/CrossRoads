import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { BuildersStackParamList } from './BuildersStack';

type BuilderProfileRouteProp = RouteProp<BuildersStackParamList, 'BuilderProfile'>;

export default function BuilderProfileScreen() {
    const route = useRoute<BuilderProfileRouteProp>();
    const { builderId } = route.params;
    const [builder, setBuilder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuilder = async () => {
            const { data, error } = await supabase
                .from('builder_profiles')
                .select('*')
                .eq('id', builderId)
                .single();

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setBuilder(data);
            }
            setLoading(false);
        };
        fetchBuilder();
    }, [builderId]);

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
    if (!builder) return <View style={styles.center}><Text>Builder not found</Text></View>;

    return (
        <View style={styles.container}>
            <Text style={styles.name}>{builder.business_name}</Text>
            <Text style={styles.rate}>${builder.hourly_rate}/hr</Text>

            <View style={styles.chips}>
                {builder.expertise?.map((ex: string) => (
                    <View key={ex} style={styles.chip}>
                        <Text>{ex}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.bio}>{builder.bio}</Text>

            <Text style={styles.radius}>Travels up to {builder.travel_radius_km} km</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: 'bold' },
    rate: { fontSize: 18, color: 'green', marginVertical: 5 },
    bio: { fontSize: 16, marginTop: 15, lineHeight: 24 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    chip: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 5, marginBottom: 5 },
    radius: { marginTop: 20, color: 'gray', fontStyle: 'italic' }
});
