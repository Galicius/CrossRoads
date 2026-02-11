import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function InviteCodeScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [mode, setMode] = useState<'scanner' | 'manual'>('scanner');
    const [manualCode, setManualCode] = useState('');
    const [validating, setValidating] = useState(false);
    const navigation = useNavigation<any>();

    useEffect(() => {
        const getPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
            if (status !== 'granted') {
                setMode('manual');
            }
        };
        getPermissions();
    }, []);

    const validateCode = async (code: string) => {
        setValidating(true);
        try {
            const trimmed = code.trim().toUpperCase();
            if (!trimmed) {
                Alert.alert('Invalid', 'Please enter a valid invite code.');
                return;
            }

            // Look up the invite code in profiles
            const { data: inviter, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('invite_code', trimmed)
                .single();

            if (error || !inviter) {
                Alert.alert('Invalid Code', 'This invite code was not found. Please check and try again.');
                return;
            }

            Alert.alert(
                'Code Verified! ✓',
                `Invited by ${inviter.full_name || 'a CrossRoads nomad'}. You'll be verified once you create your account.`,
                [
                    {
                        text: 'Continue to Sign Up',
                        onPress: () => {
                            // Pass inviter info to Auth screen
                            navigation.replace('Auth', { invitedBy: inviter.id });
                        },
                    },
                ]
            );
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setValidating(false);
        }
    };

    const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
        setScanned(true);
        validateCode(data);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Tab Switcher */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, mode === 'scanner' && styles.activeTab]}
                    onPress={() => setMode('scanner')}
                >
                    <Ionicons name="qr-code-outline" size={18} color={mode === 'scanner' ? '#5659ab' : '#999'} />
                    <Text style={[styles.tabText, mode === 'scanner' && styles.activeTabText]}>Scan QR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, mode === 'manual' && styles.activeTab]}
                    onPress={() => setMode('manual')}
                >
                    <Ionicons name="keypad-outline" size={18} color={mode === 'manual' ? '#5659ab' : '#999'} />
                    <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Enter Code</Text>
                </TouchableOpacity>
            </View>

            {mode === 'scanner' ? (
                <View style={styles.scannerContainer}>
                    {hasPermission ? (
                        <>
                            <CameraView
                                style={StyleSheet.absoluteFillObject}
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr'],
                                }}
                            />
                            {/* Scan overlay frame */}
                            <View style={styles.scanOverlay}>
                                <View style={styles.scanFrame} />
                                <Text style={styles.scanHint}>
                                    Point camera at a nomad's QR code
                                </Text>
                            </View>
                            {scanned && (
                                <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                                    <Ionicons name="refresh" size={20} color="white" />
                                    <Text style={styles.rescanText}>Scan Again</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <View style={styles.noCamera}>
                            <Ionicons name="camera-outline" size={48} color="#ccc" />
                            <Text style={styles.noCameraText}>Camera access required</Text>
                            <TouchableOpacity onPress={() => setMode('manual')}>
                                <Text style={styles.switchText}>Enter code manually instead</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.manualContainer}>
                    <View style={styles.manualCard}>
                        <Ionicons name="ticket-outline" size={48} color="#5659ab" style={{ marginBottom: 15 }} />
                        <Text style={styles.manualTitle}>Enter Invite Code</Text>
                        <Text style={styles.manualSubtitle}>
                            Ask an existing CrossRoads nomad for their invite code
                        </Text>

                        <TextInput
                            style={styles.codeInput}
                            placeholder="e.g. A1B2C3D4"
                            placeholderTextColor="#bbb"
                            value={manualCode}
                            onChangeText={(t) => setManualCode(t.toUpperCase())}
                            autoCapitalize="characters"
                            maxLength={8}
                            autoCorrect={false}
                        />

                        <TouchableOpacity
                            style={[styles.verifyBtn, (!manualCode.trim() || validating) && styles.verifyBtnDisabled]}
                            onPress={() => validateCode(manualCode)}
                            disabled={!manualCode.trim() || validating}
                        >
                            <Text style={styles.verifyBtnText}>
                                {validating ? 'Verifying...' : 'Verify Code'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        gap: 6,
    },
    activeTab: {
        backgroundColor: '#eef0ff',
        borderWidth: 1.5,
        borderColor: '#5659ab',
    },
    tabText: { fontSize: 14, color: '#999', fontWeight: '600' },
    activeTabText: { color: '#5659ab' },

    // Scanner mode
    scannerContainer: { flex: 1, margin: 20, borderRadius: 20, overflow: 'hidden' },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 220,
        height: 220,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20,
    },
    scanHint: {
        color: 'white',
        marginTop: 20,
        fontSize: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    rescanBtn: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5659ab',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    rescanText: { color: 'white', fontWeight: '600' },

    // No camera
    noCamera: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noCameraText: { color: '#999', fontSize: 16, marginTop: 10 },
    switchText: { color: '#5659ab', fontWeight: '600', marginTop: 15 },

    // Manual mode
    manualContainer: { flex: 1, justifyContent: 'center', padding: 20 },
    manualCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    manualTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    manualSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    codeInput: {
        width: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: 14,
        padding: 16,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 4,
        color: '#333',
        borderWidth: 1,
        borderColor: '#eee',
    },
    verifyBtn: {
        width: '100%',
        backgroundColor: '#5659ab',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    verifyBtnDisabled: { opacity: 0.5 },
    verifyBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
