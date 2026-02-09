import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

const EXPERTISE_OPTIONS = [
    'Solar', 'Electrical', 'Plumbing', 'Carpentry', 'Metalwork', 'Mechanic', 'Insulation', 'Design'
];

export default function BuilderRegistrationScreen() {
    const navigation = useNavigation();
    const [businessName, setBusinessName] = useState('');
    const [bio, setBio] = useState('');
    const [rate, setRate] = useState('');
    const [radius, setRadius] = useState('50');
    const [expertise, setExpertise] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleExpertise = (item: string) => {
        if (expertise.includes(item)) {
            setExpertise(expertise.filter(i => i !== item));
        } else {
            setExpertise([...expertise, item]);
        }
    };

    const register = async () => {
        if (!businessName || !rate) {
            Alert.alert('Error', 'Please fill in required fields.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('builder_profiles').insert({
                id: user.id,
                business_name: businessName,
                bio,
                hourly_rate: parseFloat(rate),
                travel_radius_km: parseInt(radius),
                expertise,
                is_active: true
            });

            if (error) throw error;
            Alert.alert('Success', 'Welcome to the Builder Network!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Business / Display Name *</Text>
            <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Nomad Customs" />

            <Text style={styles.label}>Expertise (Select all that apply)</Text>
            <View style={styles.chips}>
                {EXPERTISE_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.chip, expertise.includes(opt) && styles.chipActive]}
                        onPress={() => toggleExpertise(opt)}
                    >
                        <Text style={[styles.chipText, expertise.includes(opt) && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Hourly Rate ($) *</Text>
            <TextInput style={styles.input} value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="50" />

            <Text style={styles.label}>Travel Radius (km)</Text>
            <TextInput style={styles.input} value={radius} onChangeText={setRadius} keyboardType="numeric" placeholder="50" />

            <Text style={styles.label}>Bio / Description</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={bio} onChangeText={setBio} multiline />

            <TouchableOpacity style={styles.btn} onPress={register} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Registering...' : 'Register as Builder'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
    chips: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f0f0', borderRadius: 15, marginRight: 8, marginBottom: 8 },
    chipActive: { backgroundColor: '#FF6347' },
    chipText: { color: '#333' },
    chipTextActive: { color: 'white' },
    btn: { backgroundColor: '#FF6347', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 50 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
