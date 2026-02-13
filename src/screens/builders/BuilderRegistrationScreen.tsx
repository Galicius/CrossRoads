import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

const EXPERTISE_OPTIONS = [
    { name: 'Solar', icon: 'sunny-outline' },
    { name: 'Electrical', icon: 'flash-outline' },
    { name: 'Plumbing', icon: 'water-outline' },
    { name: 'Carpentry', icon: 'hammer-outline' },
    { name: 'Metalwork', icon: 'settings-outline' },
    { name: 'Mechanic', icon: 'car-outline' },
    { name: 'Insulation', icon: 'home-outline' },
    { name: 'Design', icon: 'brush-outline' }
];

export default function BuilderRegistrationScreen() {
    const navigation = useNavigation();
    const [businessName, setBusinessName] = useState('');
    const [bio, setBio] = useState('');
    const [rate, setRate] = useState('');
    const [radius, setRadius] = useState('50');
    const [expertise, setExpertise] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    React.useEffect(() => {
        fetchExistingProfile();
    }, []);

    const fetchExistingProfile = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('builder_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setBusinessName(data.business_name || '');
                setBio(data.bio || '');
                setRate(data.hourly_rate?.toString() || '');
                setRadius(data.travel_radius_km?.toString() || '50');
                setExpertise(data.expertise || []);
                setIsEditing(true);
            }
        } catch (error) {
            console.error('Error fetching builder profile:', error);
        } finally {
            setLoading(false);
        }
    };

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

            const { error } = await supabase.from('builder_profiles').upsert({
                id: user.id,
                business_name: businessName,
                bio,
                hourly_rate: parseFloat(rate),
                travel_radius_km: parseInt(radius),
                expertise,
                is_active: true,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;
            Alert.alert('Success', isEditing ? 'Profile updated!' : 'Welcome to the Builder Network!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Builder Profile' : 'Become a Builder'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 50 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.inputLabel}>Business / Display Name *</Text>
                <TextInput
                    style={styles.modalInput}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Nomad Customs"
                />

                <Text style={styles.inputLabel}>Expertise (Select all that apply)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                    {EXPERTISE_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.name}
                            style={[
                                styles.categoryChip,
                                expertise.includes(opt.name) && styles.categoryChipSelected
                            ]}
                            onPress={() => toggleExpertise(opt.name)}
                        >
                            <Ionicons
                                name={opt.icon as any}
                                size={16}
                                color={expertise.includes(opt.name) ? 'white' : '#666'}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[
                                styles.categoryChipText,
                                expertise.includes(opt.name) && styles.categoryChipTextSelected
                            ]}>{opt.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Hourly Rate ($) *</Text>
                <TextInput
                    style={styles.modalInput}
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="numeric"
                    placeholder="50"
                />

                <Text style={styles.inputLabel}>Travel Radius (km)</Text>
                <TextInput
                    style={styles.modalInput}
                    value={radius}
                    onChangeText={setRadius}
                    keyboardType="numeric"
                    placeholder="50"
                />

                <Text style={styles.inputLabel}>Bio / Description</Text>
                <TextInput
                    style={[styles.modalInput, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about your services..."
                    multiline
                />

                <TouchableOpacity
                    style={styles.modalButton}
                    onPress={register}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.modalButtonText}>
                            {isEditing ? 'Update Builder Profile' : 'Register as Builder'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 15,
    },
    modalInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    categorySelector: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryChipSelected: {
        backgroundColor: '#5B7FFF',
        borderColor: '#5B7FFF',
    },
    categoryChipText: {
        color: '#666',
        fontWeight: '600',
    },
    categoryChipTextSelected: {
        color: 'white',
    },
    modalButton: {
        backgroundColor: '#5B7FFF',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#5B7FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
