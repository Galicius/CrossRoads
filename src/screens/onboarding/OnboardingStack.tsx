import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const THEME_COLOR = '#5659ab';

const ScreenWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.progressBar}>
                <View style={styles.progressFill} />
            </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
            {children}
        </ScrollView>
    </View>
);

import { supabase } from '@/lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';

function ProfileBasics() {
    const navigation = useNavigation<any>();
    const [firstName, setFirstName] = useState('');
    const [age, setAge] = useState('');

    return (
        <ScreenWrapper title="About You">
            <Text style={styles.label}>What's your name?</Text>
            <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#aaa"
                value={firstName}
                onChangeText={setFirstName}
            />

            <Text style={styles.label}>How old are you?</Text>
            <TextInput
                style={styles.input}
                placeholder="Age"
                keyboardType="numeric"
                placeholderTextColor="#aaa"
                value={age}
                onChangeText={setAge}
            />

            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('VanLifestyle', { firstName, age })}>
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

function VanLifestyle({ route }: any) {
    const navigation = useNavigation<any>();
    const [vanType, setVanType] = useState('');
    const prevData = route.params || {};

    return (
        <ScreenWrapper title="Van Life">
            <Text style={styles.label}>What do you drive?</Text>
            <View style={styles.options}>
                {['Sprinter', 'Promaster', 'Transit', 'Skoolie', 'Car/SUV'].map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.optionChip, vanType === opt && styles.selectedChip]}
                        onPress={() => setVanType(opt)}
                    >
                        <Text style={[styles.optionText, vanType === opt && styles.selectedOptionText]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Interests', { ...prevData, vanType })}>
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

function Interests({ route }: any) {
    const navigation = useNavigation<any>();
    const [interests, setInterests] = useState<string[]>([]);
    const prevData = route.params || {};

    const toggleInterest = (opt: string) => {
        if (interests.includes(opt)) setInterests(interests.filter(i => i !== opt));
        else setInterests([...interests, opt]);
    };

    return (
        <ScreenWrapper title="Interests">
            <Text style={styles.label}>What defines you?</Text>
            <View style={styles.options}>
                {['🧗 Climbing', '⛷️ Skiing', '🏄 Surfing', '📸 Photo', '🚐 Building'].map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.optionChip, interests.includes(opt) && styles.selectedChip]}
                        onPress={() => toggleInterest(opt)}
                    >
                        <Text style={[styles.optionText, interests.includes(opt) && styles.selectedOptionText]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Photos', { ...prevData, interests })}>
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

function Photos({ route }: any) {
    const navigation = useNavigation<any>();
    const prevData = route.params || {};
    // Mock photo upload for now
    return (
        <ScreenWrapper title="Photos">
            <Text style={styles.label}>Show off your rig!</Text>
            <View style={styles.photoPlaceholder}><Text style={{ color: '#aaa' }}>+ Add Van Photo (Mock)</Text></View>
            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('RoutePlan', { ...prevData })}>
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

function RoutePlan({ route }: any) {
    const navigation = useNavigation<any>();
    const [startLocation, setStartLocation] = useState('');
    const [endLocation, setEndLocation] = useState('');
    const prevData = route.params || {};

    return (
        <ScreenWrapper title="Your Route">
            <Text style={styles.label}>Where did you start?</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. San Francisco, CA"
                placeholderTextColor="#aaa"
                value={startLocation}
                onChangeText={setStartLocation}
            />

            <Text style={styles.label}>Where are you heading?</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Ushuaia, Argentina"
                placeholderTextColor="#aaa"
                value={endLocation}
                onChangeText={setEndLocation}
            />

            <TouchableOpacity style={styles.nextBtn} onPress={() => navigation.navigate('Intentions', { ...prevData, startLocation, endLocation })}>
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

function Intentions({ route }: any) {
    const navigation = useNavigation<any>();
    const [intentions, setIntentions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const prevData = route.params || {};

    const toggleIntention = (opt: string) => {
        if (intentions.includes(opt)) setIntentions(intentions.filter(i => i !== opt));
        else setIntentions([...intentions, opt]);
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // If no user is logged in (e.g. skipped auth), just navigate
                navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
                return;
            }

            const profileData = {
                id: user.id,
                full_name: prevData.firstName,
                username: prevData.firstName + Math.floor(Math.random() * 1000), // temp username
                route_start: prevData.startLocation,
                route_end: prevData.endLocation,
                // avatar_url: ... 
            };

            const { error } = await supabase.from('profiles').upsert(profileData);
            if (error) throw error;

            // Navigate
            navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });

        } catch (e: any) {
            Alert.alert("Error Saving Profile", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper title="Intentions">
            <Text style={styles.label}>I'm looking for...</Text>
            <View style={styles.options}>
                {['Dates', 'Friends', 'Build Help', 'Travel Buddy'].map(opt => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.optionChip, intentions.includes(opt) && styles.selectedChip]}
                        onPress={() => toggleIntention(opt)}
                    >
                        <Text style={[styles.optionText, intentions.includes(opt) && styles.selectedOptionText]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: '#333' }]}
                onPress={handleFinish}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.nextBtnText}>Start Journey</Text>}
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

const Stack = createNativeStackNavigator({
    screens: {
        ProfileBasics: { screen: ProfileBasics, options: { headerShown: false } },
        VanLifestyle: { screen: VanLifestyle, options: { headerShown: false } },
        Interests: { screen: Interests, options: { headerShown: false } },
        Photos: { screen: Photos, options: { headerShown: false } },
        RoutePlan: { screen: RoutePlan, options: { headerShown: false } },
        Intentions: { screen: Intentions, options: { headerShown: false } },
    },
});

export default Stack;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { padding: 20, paddingTop: 60, backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME_COLOR },
    progressBar: { height: 4, backgroundColor: '#eee', marginTop: 15, borderRadius: 2 },
    progressFill: { width: '20%', height: '100%', backgroundColor: THEME_COLOR, borderRadius: 2 },
    content: { padding: 30 },
    label: { fontSize: 18, color: '#333', marginBottom: 15, fontWeight: '600' },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
    nextBtn: { backgroundColor: THEME_COLOR, padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 20, shadowColor: THEME_COLOR, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    optionChip: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
    selectedChip: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
    optionText: { color: '#5659ab', fontWeight: '500' },
    selectedOptionText: { color: 'white' },
    photoPlaceholder: { height: 200, backgroundColor: '#eee', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', marginBottom: 20 },
});
