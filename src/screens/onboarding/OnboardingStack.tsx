import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { PlaceAutocomplete } from '@/components/ui/PlaceAutocomplete';
import { RouteMap, Checkpoint } from '@/components/map/RouteMap';

const THEME_COLOR = '#5659ab';

const ScreenWrapper = ({ children, title, step, totalSteps }: { children: React.ReactNode, title: string, step: number, totalSteps: number }) => (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
            </View>
            <Text style={styles.stepText}>Step {step} of {totalSteps}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
        </ScrollView>
    </View>
);

function ProfileBasics() {
    const navigation = useNavigation<any>();
    const [firstName, setFirstName] = useState('');
    const [age, setAge] = useState('');

    return (
        <ScreenWrapper title="About You" step={1} totalSteps={6}>
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

            <TouchableOpacity
                style={[styles.nextBtn, (!firstName.trim()) && styles.disabledBtn]}
                onPress={() => navigation.navigate('VanLifestyle', { firstName, age })}
                disabled={!firstName.trim()}
            >
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
        <ScreenWrapper title="Van Life" step={2} totalSteps={6}>
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
        <ScreenWrapper title="Interests" step={3} totalSteps={6}>
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
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        try {
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(fileName, arrayBuffer, {
                    contentType: blob.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile-images')
                .getPublicUrl(fileName);

            setImages(prev => [...prev, publicUrl]);
        } catch (error: any) {
            Alert.alert("Upload Error", error.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteImage = (urlToDelete: string) => {
        setImages(images.filter(img => img !== urlToDelete));
    };

    return (
        <ScreenWrapper title="Photos" step={4} totalSteps={6}>
            <Text style={styles.label}>Show off your rig & yourself!</Text>
            <Text style={styles.sublabel}>Add up to 6 photos. Your first photo will be your profile picture.</Text>

            <View style={styles.galleryGrid}>
                {images.map((img, index) => (
                    <View key={index} style={styles.galleryItem}>
                        <Image source={{ uri: img }} style={styles.galleryImage} />
                        {index === 0 && (
                            <View style={styles.mainBadge}>
                                <Text style={styles.mainBadgeText}>Main</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => deleteImage(img)} style={styles.deleteBtn}>
                            <IconSymbol name="xmark" size={12} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}
                {images.length < 6 && (
                    <TouchableOpacity onPress={pickImage} style={[styles.galleryItem, styles.addBtn]} disabled={uploading}>
                        {uploading ? (
                            <ActivityIndicator color={THEME_COLOR} />
                        ) : (
                            <>
                                <IconSymbol name="plus" size={28} color={THEME_COLOR} />
                                <Text style={styles.addBtnText}>Add Photo</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                style={[styles.nextBtn, images.length === 0 && styles.disabledBtn]}
                onPress={() => navigation.navigate('RoutePlan', { ...prevData, images })}
                disabled={images.length === 0}
            >
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => navigation.navigate('RoutePlan', { ...prevData, images: [] })}
            >
                <Text style={styles.skipBtnText}>Skip for now</Text>
            </TouchableOpacity>
        </ScreenWrapper>
    );
}

function RoutePlan({ route }: any) {
    const navigation = useNavigation<any>();
    const prevData = route.params || {};
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

    const handleAddPlace = (place: { name: string; lat: number; lng: number }) => {
        const newCheckpoint: Checkpoint = {
            id: Date.now().toString(),
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            durationDays: 1
        };
        setCheckpoints(prev => [...prev, newCheckpoint]);
    };

    const handleRemoveCheckpoint = (id: string) => {
        setCheckpoints(checkpoints.filter(c => c.id !== id));
    };

    return (
        <ScreenWrapper title="Your Route" step={5} totalSteps={6}>
            <Text style={styles.label}>Where are you heading?</Text>
            <Text style={styles.sublabel}>Add stops along your route so others can find you.</Text>

            <View style={{ zIndex: 1000, marginBottom: 15 }}>
                <PlaceAutocomplete onSelect={handleAddPlace} placeholder="Search for a city..." />
            </View>

            {checkpoints.length > 0 && (
                <View style={styles.mapPreview}>
                    <RouteMap checkpoints={checkpoints} style={StyleSheet.absoluteFill} />
                </View>
            )}

            {checkpoints.length > 0 && (
                <View style={styles.checkpointList}>
                    {checkpoints.map((cp, index) => (
                        <View key={cp.id} style={styles.checkpointItem}>
                            <View style={styles.orderBadge}>
                                <Text style={styles.orderText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.checkpointName} numberOfLines={1}>{cp.name}</Text>
                            <TouchableOpacity onPress={() => handleRemoveCheckpoint(cp.id)} style={styles.removeBtn}>
                                <IconSymbol name="xmark.circle.fill" size={20} color="#d32f2f" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity
                style={[styles.nextBtn, checkpoints.length === 0 && styles.disabledBtn]}
                onPress={() => navigation.navigate('Intentions', { ...prevData, checkpoints })}
                disabled={checkpoints.length === 0}
            >
                <Text style={styles.nextBtnText}>Next Step</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => navigation.navigate('Intentions', { ...prevData, checkpoints: [] })}
            >
                <Text style={styles.skipBtnText}>Skip for now</Text>
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
                navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
                return;
            }

            const uploadedImages: string[] = prevData.images || [];
            const routeCheckpoints: Checkpoint[] = prevData.checkpoints || [];

            const profileData: any = {
                id: user.id,
                full_name: prevData.firstName,
                username: prevData.firstName + Math.floor(Math.random() * 1000),
                age: prevData.age ? parseInt(prevData.age) : null,
                avatar_url: uploadedImages.length > 0 ? uploadedImages[0] : null,
                images: uploadedImages,
                route_data: routeCheckpoints,
            };

            // If we have route checkpoints, set location from first checkpoint
            if (routeCheckpoints.length > 0) {
                profileData.latitude = routeCheckpoints[0].lat;
                profileData.longitude = routeCheckpoints[0].lng;
                profileData.route_start = routeCheckpoints[0].name;
                profileData.route_end = routeCheckpoints[routeCheckpoints.length - 1].name;
            }

            const { error } = await supabase.from('profiles').upsert(profileData);
            if (error) throw error;

            navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });

        } catch (e: any) {
            Alert.alert("Error Saving Profile", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper title="Intentions" step={6} totalSteps={6}>
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
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.nextBtnText}>Start Journey 🚐</Text>}
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
    progressFill: { height: '100%', backgroundColor: THEME_COLOR, borderRadius: 2 },
    stepText: { fontSize: 12, color: '#aaa', marginTop: 8 },
    content: { padding: 30, paddingBottom: 50 },
    label: { fontSize: 18, color: '#333', marginBottom: 8, fontWeight: '600' },
    sublabel: { fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 20 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
    nextBtn: { backgroundColor: THEME_COLOR, padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 20, shadowColor: THEME_COLOR, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    disabledBtn: { opacity: 0.5 },
    skipBtn: { alignItems: 'center', marginTop: 15 },
    skipBtnText: { color: '#888', fontSize: 14 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    optionChip: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
    selectedChip: { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
    optionText: { color: '#5659ab', fontWeight: '500' },
    selectedOptionText: { color: 'white' },

    // Gallery styles
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
    galleryItem: {
        width: '30%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
        backgroundColor: '#f0f0f0', marginBottom: 5
    },
    galleryImage: { width: '100%', height: '100%' },
    addBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed' },
    addBtnText: { fontSize: 11, color: THEME_COLOR, marginTop: 4, fontWeight: '500' },
    deleteBtn: {
        position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)',
        width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center'
    },
    mainBadge: {
        position: 'absolute', bottom: 4, left: 4, backgroundColor: THEME_COLOR,
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8
    },
    mainBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    // Route/Map styles
    mapPreview: { height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
    checkpointList: { marginBottom: 10 },
    checkpointItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee'
    },
    orderBadge: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: THEME_COLOR,
        alignItems: 'center', justifyContent: 'center', marginRight: 10
    },
    orderText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    checkpointName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#333' },
    removeBtn: { padding: 4 },
});
