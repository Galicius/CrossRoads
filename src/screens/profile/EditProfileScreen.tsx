import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Toast } from '@/components/ui/Toast';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function EditProfileScreen() {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile Data
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [age, setAge] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [images, setImages] = useState<string[]>([]);
    const [userType, setUserType] = useState<string | null>(null);

    // Nomad Settings
    const [showLandloversDating, setShowLandloversDating] = useState(true);
    const [showLandloversSocial, setShowLandloversSocial] = useState(true);

    const [routeData, setRouteData] = useState<any[]>([]);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success'
    });


    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setFullName(data.full_name || '');
                setBio(data.bio || '');
                setWebsite(data.website || '');
                setAge(data.age ? data.age.toString() : '');
                setAvatarUrl(data.avatar_url);
                setImages(data.images || []);
                setRouteData((data.route_data as any[]) || []);
                setUserType(data.user_type);
                setShowLandloversDating(data.show_landlovers_dating !== false);
                setShowLandloversSocial(data.show_landlovers_social !== false);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'Could not load profile data');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async (isAvatar: boolean) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: isAvatar, // Crop only for avatar
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            if (isAvatar) {
                uploadImage(uri, true); // Upload immediately for avatar? Or wait for save? 
                // Let's upload immediately to get the URL, simpler logic for now. 
                // Or better: store local URI and upload on Save.
                // For this implementation, I'll try to keep it simple: Upload immediately.
            } else {
                uploadImage(uri, false);
            }
        }
    };

    const uploadImage = async (uri: string, isAvatar: boolean) => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-images')
                .upload(filePath, arrayBuffer, {
                    contentType: blob.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile-images')
                .getPublicUrl(filePath);

            if (isAvatar) {
                setAvatarUrl(publicUrl);
                // Update profile immediately for avatar? Or just state? 
                // Let's just update state, and save metadata on "Save"
            } else {
                setImages([...images, publicUrl]);
            }

        } catch (error: any) {
            Alert.alert("Upload Error", error.message);
        } finally {
            setSaving(false);
        }
    };

    const deleteImage = async (urlToDelete: string) => {
        // Optimistic update
        setImages(images.filter(img => img !== urlToDelete));

        // TODO: Also delete from storage if we want to be clean, 
        // but for now just removing from the array is enough to 'hide' it.
        // To delete from storage we'd need to parse the path from the URL.
        // Implementation for storage delete can be added later as an enhancement.
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const updates = {
                id: user.id,
                full_name: fullName,
                bio: bio,
                website: website,
                age: age ? parseInt(age) : null,
                avatar_url: avatarUrl,
                images: images,
                show_landlovers_dating: showLandloversDating,
                show_landlovers_social: showLandloversSocial,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            setToast({ visible: true, message: "Profile updated successfully!", type: 'success' });
            setTimeout(() => {
                navigation.goBack();
            }, 1000);

        } catch (error: any) {
            console.error("Save error:", error);
            setToast({ visible: true, message: error.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert("Error", error.message);
            return;
        }
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Landing' }],
            })
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4d73ba" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#4d73ba" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={() => pickImage(true)}>
                        <Image
                            source={{ uri: avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
                            style={styles.avatar}
                        />
                        <View style={styles.editBadge}>
                            <IconSymbol name="camera.fill" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => pickImage(true)} style={{ marginTop: 10 }}>
                        <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your Name" />

                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself..."
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.label}>Website</Text>
                    <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://..." autoCapitalize="none" />

                    <Text style={styles.label}>Age</Text>
                    <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="25" keyboardType="numeric" />
                </View>

                {/* Gallery Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gallery</Text>
                    <Text style={styles.sectionSubtitle}>Add more photos to your profile</Text>

                    <View style={styles.galleryGrid}>
                        {images.map((img, index) => (
                            <View key={index} style={styles.galleryItem}>
                                <Image source={{ uri: img }} style={styles.galleryImage} />
                                <TouchableOpacity onPress={() => deleteImage(img)} style={styles.deleteBtn}>
                                    <IconSymbol name="xmark" size={12} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity onPress={() => pickImage(false)} style={[styles.galleryItem, styles.addBtn]}>
                            <IconSymbol name="plus" size={24} color="#4d73ba" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Route Edit Button */}
                <TouchableOpacity
                    style={styles.routeBtn}
                    onPress={() => navigation.navigate('EditRouteScreen', { currentRoute: routeData })}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <IconSymbol name="map" size={20} color="#4d73ba" />
                        <Text style={styles.routeBtnText}>Edit My Route</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color="#ccc" />
                </TouchableOpacity>

                {/* Nomad Settings Section */}
                {userType !== 'landlover' && (
                    <View style={styles.section}>
                        <View style={styles.settingsHeader}>
                            <Ionicons name="settings-outline" size={20} color="#4d73ba" />
                            <Text style={styles.sectionTitle}> Nomad Settings</Text>
                        </View>
                        <Text style={styles.sectionSubtitle}>Control what you see in the app</Text>

                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Show Landlovers in Dating</Text>
                                <Text style={styles.settingSublabel}>See non-nomad profiles in dating cards</Text>
                            </View>
                            <Switch
                                value={showLandloversDating}
                                onValueChange={setShowLandloversDating}
                                trackColor={{ false: '#ddd', true: '#4d73ba' }}
                                thumbColor="#fff"
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Show Landlovers in Social</Text>
                                <Text style={styles.settingSublabel}>See non-nomad profiles in social feed</Text>
                            </View>
                            <Switch
                                value={showLandloversSocial}
                                onValueChange={setShowLandloversSocial}
                                trackColor={{ false: '#ddd', true: '#4d73ba' }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 50 }} />
            </ScrollView>

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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 17, fontWeight: '600' },
    headerBtn: { padding: 4 },
    cancelText: { fontSize: 16, color: '#666' },
    saveText: { fontSize: 16, color: '#4d73ba', fontWeight: 'bold' },
    content: { padding: 20 },

    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    editBadge: {
        position: 'absolute', right: 0, bottom: 0, backgroundColor: '#4d73ba',
        width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'white'
    },
    changePhotoText: { color: '#4d73ba', fontWeight: '600', fontSize: 14 },

    formSection: { marginBottom: 30 },
    label: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '500' },
    input: {
        backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee',
        marginBottom: 16, fontSize: 16
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },

    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    sectionSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },

    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    galleryItem: {
        width: '30%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden',
        backgroundColor: '#f0f0f0', marginBottom: 10
    },
    galleryImage: { width: '100%', height: '100%' },
    addBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
    deleteBtn: {
        position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)',
        width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center'
    },

    routeBtn: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 30,
        borderWidth: 1, borderColor: '#eee'
    },
    routeBtnText: { fontSize: 16, fontWeight: '500', marginLeft: 10, color: '#333' },

    logoutBtn: {
        backgroundColor: '#ffebee', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center'
    },
    logoutText: { color: '#d32f2f', fontWeight: '600', fontSize: 16 },

    // New styles for Nomad Settings
    settingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    settingSublabel: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
});
