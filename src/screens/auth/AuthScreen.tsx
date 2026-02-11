import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Install if needed, or use solid bg

import { supabase } from '@/lib/supabase';
import { Alert, TextInput, ActivityIndicator } from 'react-native';

export default function AuthScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const invitedBy = route.params?.invitedBy || null;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(!!invitedBy); // Default to sign-up if coming from invite

    async function handleAuth() {
        setLoading(true);
        try {
            if (isSignUp) {
                const { error, data: signUpData } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;

                // If user was invited, mark them as verified
                if (invitedBy && signUpData.user) {
                    await supabase
                        .from('profiles')
                        .update({ is_verified: true, invited_by: invitedBy })
                        .eq('id', signUpData.user.id);
                }

                Alert.alert('Success', 'Check your email for the confirmation link!');
            } else {
                const { error, data } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Check if profile exists
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile) {
                    navigation.replace('HomeTabs');
                } else {
                    navigation.replace('Onboarding');
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.innerContainer}>
                    {/* Decorative top shape */}
                    <View style={styles.topShape} />

                    <View style={styles.content}>
                        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
                        <Text style={styles.subtitle}>{isSignUp ? 'Join the community.' : 'Log in to continue your journey.'}</Text>

                        <View style={{ gap: 15, marginBottom: 30 }}>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#aaa"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#aaa"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.googleBtn}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#333" />
                            ) : (
                                <Text style={styles.googleBtnText}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                            <Text style={styles.linkText}>
                                {isSignUp ? 'Already have an account? Log In' : 'New here? Create Account'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    innerContainer: { flex: 1 },
    topShape: {
        position: 'absolute',
        top: -100,
        left: -50,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#5659ab',
        opacity: 0.2,
    },
    content: { flex: 1, justifyContent: 'center', padding: 30 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#5659ab', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
    input: { backgroundColor: 'white', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
    googleBtn: {
        backgroundColor: 'white',
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#eee'
    },
    googleBtnText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    linkText: { textAlign: 'center', color: '#5659ab', fontWeight: '600' },
});
