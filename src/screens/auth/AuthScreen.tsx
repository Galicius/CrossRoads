import React, { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { supabase } from '@/lib/supabase';
import { Alert, TextInput, ActivityIndicator } from 'react-native';

export default function AuthScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();

    // Animation state
    const keyboardAnim = useRef(new Animated.Value(0)).current;

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSubscription = Keyboard.addListener(showEvent, () => {
            Animated.timing(keyboardAnim, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start();
        });
        const hideSubscription = Keyboard.addListener(hideEvent, () => {
            Animated.timing(keyboardAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }).start();
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const invitedBy = route.params?.invitedBy || null;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(!!invitedBy); // Default to sign-up if coming from invite

    // Interpolations
    const imageWidth = keyboardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['100%', '25%'] // Shrink to 25%
    });
    const imageHeight = keyboardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['35%', '15%']
    });
    const imageTop = keyboardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, insets.top]
    });
    const imageRight = keyboardAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20]
    });

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
                    <TouchableOpacity
                        style={[styles.backButton, { top: insets.top + 10 }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>

                    <Animated.View style={{
                        position: 'absolute',
                        right: imageRight,
                        top: imageTop,
                        width: imageWidth,
                        height: imageHeight,
                        zIndex: 0,
                    }}>
                        <Image
                            source={require('@/assets/images/image.svg')}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="contain"
                        />
                    </Animated.View>

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
    container: { flex: 1, backgroundColor: 'white' },
    innerContainer: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', padding: 35 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#4d73ba', marginBottom: 10, marginTop: 50 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 35 },
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
    linkText: { textAlign: 'center', color: '#4d73ba', fontWeight: '600' },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 100,
        padding: 5,
    },
});
