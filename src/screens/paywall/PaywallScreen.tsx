import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRevenueCat } from '../../context/RevenueCatContext';

export default function PaywallScreen() {
    const navigation = useNavigation();
    const { presentPaywall, isPro } = useRevenueCat();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const show = async () => {
            // If already pro, go back immediately?
            if (isPro) {
                navigation.goBack();
                return;
            }

            // Present the native paywall
            const bought = await presentPaywall();

            // If they bought or restored, isPro should update via context listener
            // If they cancelled, we just go back
            // In all cases, once the modal closes, we go back from this screen
            navigation.goBack();
        };

        show();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4d73ba" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
