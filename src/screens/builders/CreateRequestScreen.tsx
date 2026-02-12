import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Toast } from '@/components/ui/Toast';


const CATEGORIES = [
    'Solar / Electrical',
    'Plumbing',
    'Woodwork / Structure',
    'Insulation',
    'Heater / AC',
    'Windows / Fans',
    'Mechanical',
    'Other'
];

export default function CreateRequestScreen() {
    const navigation = useNavigation();
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success'
    });


    // Hardcoded location for now (could get from Expo Location)
    const userLocation = { latitude: 46.0569, longitude: 14.5058 }; // Ljubljana

    const submitRequest = async () => {
        if (!description.trim()) {
            setToast({ visible: true, message: 'Please describe your problem.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('help_requests').insert({
                user_id: user.id,
                category,
                description,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
            });

            if (error) throw error;

            setToast({ visible: true, message: 'Your help request has been posted!', type: 'success' });
            setTimeout(() => {
                navigation.goBack();
            }, 1000);
        } catch (error: any) {
            setToast({ visible: true, message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>What do you need help with?</Text>
            <View style={styles.categories}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.catChip, category === cat && styles.catChipActive]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Describe the problem</Text>
            <TextInput
                style={styles.input}
                multiline
                numberOfLines={6}
                placeholder="E.g. My solar controller connects but isn't charging the battery..."
                value={description}
                onChangeText={setDescription}
            />

            <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={submitRequest}
                disabled={loading}
            >
                <Text style={styles.btnText}>{loading ? 'Posting...' : 'Post Request'}</Text>
            </TouchableOpacity>

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    categories: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    catChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10, marginBottom: 10 },
    catChipActive: { backgroundColor: '#FF6347' },
    catText: { color: '#333' },
    catTextActive: { color: 'white', fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, height: 150, textAlignVertical: 'top', fontSize: 16 },
    btn: { backgroundColor: '#FF6347', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30 },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
