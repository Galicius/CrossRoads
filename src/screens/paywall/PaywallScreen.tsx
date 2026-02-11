import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRevenueCat } from '../../context/RevenueCatContext';

export default function PaywallScreen() {
    const navigation = useNavigation();
    const { isPro, currentOffering, purchasePackage, restorePurchases } = useRevenueCat();
    const [purchasing, setPurchasing] = useState(false);

    // If already pro, show a confirmation and go back
    useEffect(() => {
        if (isPro) {
            Alert.alert('You\'re already Pro! ⚡', 'You have unlimited swipes.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [isPro]);

    const handlePurchase = async (pkg: PurchasesPackage) => {
        setPurchasing(true);
        try {
            await purchasePackage(pkg);
            // isPro will update automatically via context listener
            Alert.alert('Success! 🎉', 'You are now a CrossRoads Pro member!');
            navigation.goBack();
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Error', 'Purchase failed. Please try again.');
                console.error('Purchase error:', e);
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setPurchasing(true);
        try {
            await restorePurchases();
            // isPro will update automatically via context listener
            navigation.goBack();
        } catch (e) {
            console.error('Restore error:', e);
        } finally {
            setPurchasing(false);
        }
    };

    const packages = currentOffering || [];

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#5B7FFF', '#8B5CF6']} style={styles.header}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerEmoji}>⚡</Text>
                <Text style={styles.headerTitle}>CrossRoads Pro</Text>
                <Text style={styles.headerSubtitle}>Unlock the full experience</Text>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
                {/* Benefits */}
                <View style={styles.benefitsContainer}>
                    {['Unlimited daily swipes', 'Verified builder badge', 'Priority support', 'Early access to features'].map((benefit, i) => (
                        <View key={i} style={styles.benefitRow}>
                            <Text style={styles.benefitCheck}>✓</Text>
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>

                {/* Packages */}
                {packages.length > 0 ? (
                    packages.map((pkg) => (
                        <TouchableOpacity
                            key={pkg.identifier}
                            style={styles.packageButton}
                            onPress={() => handlePurchase(pkg)}
                            disabled={purchasing}
                        >
                            <Text style={styles.packageTitle}>{pkg.product.title}</Text>
                            <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.noPackages}>
                        <Text style={styles.noPackagesText}>
                            No packages available yet.{'\n'}Purchases require a development build.
                        </Text>
                    </View>
                )}

                {/* Restore */}
                <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.restoreBtn}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>
            </ScrollView>

            {purchasing && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    headerEmoji: { fontSize: 48, marginBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    content: { flex: 1 },
    contentInner: { padding: 24 },
    benefitsContainer: { marginBottom: 24 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    benefitCheck: { fontSize: 18, color: '#34C759', fontWeight: 'bold', marginRight: 12 },
    benefitText: { fontSize: 16, color: '#333' },
    packageButton: {
        backgroundColor: '#5B7FFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    packagePrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    noPackages: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    noPackagesText: { color: '#666', textAlign: 'center', lineHeight: 22 },
    restoreBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
    restoreText: { color: '#5B7FFF', fontSize: 14 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
