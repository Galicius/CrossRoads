import React, { createContext, useContext, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// Use your actual RevenueCat API Keys here
const APIKeys = {
    apple: 'appl_...', // Placeholder if you have iOS
    google: 'goog_bpvXRjYOaPVMMnymtWNJNWisbbL',
};

const ENTITLEMENT_ID = 'CrossRoads Pro';

let isRCConfigured = false;

interface RevenueCatContextType {
    customerInfo: CustomerInfo | null;
    isPro: boolean;
    currentOffering: PurchasesPackage[] | null;
    purchasePackage: (pack: PurchasesPackage) => Promise<void>;
    restorePurchases: () => Promise<void>;
    presentPaywall: () => Promise<boolean>;
    presentPaywallIfNeeded: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [currentOffering, setCurrentOffering] = useState<PurchasesPackage[] | null>(null);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                if (!isRCConfigured) {
                    isRCConfigured = true;
                    const apiKey = Platform.OS === 'android' ? APIKeys.google : APIKeys.apple;
                    console.log('RC: Configuring with API Key:', apiKey?.substring(0, 8) + '...');

                    if (Platform.OS === 'android') {
                        await Purchases.configure({ apiKey: APIKeys.google });
                    } else {
                        await Purchases.configure({ apiKey: APIKeys.apple });
                    }
                    console.log('RC: Configured successfully');
                }

                // Set debug logs level
                await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

                const info = await Purchases.getCustomerInfo();
                console.log('RC: Customer Info fetched:', info?.entitlements?.active);
                setCustomerInfo(info);
                checkEntitlements(info);

                try {
                    const offerings = await Purchases.getOfferings();
                    console.log('RC: Offerings fetched:', JSON.stringify(offerings, null, 2));

                    if (offerings.current && offerings.current.availablePackages.length !== 0) {
                        console.log('RC: Current offering has packages:', offerings.current.availablePackages.length);
                        setCurrentOffering(offerings.current.availablePackages);
                    } else {
                        console.log('RC: Current offering is empty or missing. Check RevenueCat dashboard.');
                    }
                } catch (e) {
                    console.error('RC: Error fetching offerings', e);
                }
            } catch (e) {
                console.error('RC: Error initializing', e);
            }
        };

        init();

        // Listen for customer info changes (e.g. purchase completed, restored, etc.)
        Purchases.addCustomerInfoUpdateListener((info) => {
            console.log('RC: Customer Info updated:', info?.entitlements?.active);
            setCustomerInfo(info);
            checkEntitlements(info);
        });
    }, []);

    const checkEntitlements = async (info: CustomerInfo) => {
        const pro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsPro(pro);

        // Sync verification status for all users (and builders if applicable)
        if (pro) {
            syncVerification();
        }
    };

    const syncVerification = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Verify Main Profile (for all users)
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_verified')
                .eq('id', user.id)
                .single();

            if (profile && !profile.is_verified) {
                await supabase
                    .from('profiles')
                    .update({ is_verified: true })
                    .eq('id', user.id);
            }

            // 2. Verify Builder Profile (if exists)
            const { data: builder } = await supabase
                .from('builder_profiles')
                .select('id, is_verified')
                .eq('id', user.id)
                .single();

            if (builder && !builder.is_verified) {
                await supabase
                    .from('builder_profiles')
                    .update({ is_verified: true })
                    .eq('id', user.id);
            }
        } catch (error) {
            console.log('Error syncing verification:', error);
        }
    }

    const presentPaywall = async (): Promise<boolean> => {
        // Present paywall for current offering:
        const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

        switch (paywallResult) {
            case PAYWALL_RESULT.NOT_PRESENTED:
            case PAYWALL_RESULT.ERROR:
            case PAYWALL_RESULT.CANCELLED:
                return false;
            case PAYWALL_RESULT.PURCHASED:
            case PAYWALL_RESULT.RESTORED:
                return true;
            default:
                return false;
        }
    };

    const presentPaywallIfNeeded = async (): Promise<boolean> => {
        const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: ENTITLEMENT_ID
        });

        switch (paywallResult) {
            case PAYWALL_RESULT.NOT_PRESENTED:
            case PAYWALL_RESULT.ERROR:
            case PAYWALL_RESULT.CANCELLED:
                return false;
            case PAYWALL_RESULT.PURCHASED:
            case PAYWALL_RESULT.RESTORED:
                return true;
            default:
                return false;
        }
    };

    const purchasePackage = async (pack: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            setCustomerInfo(customerInfo);
            checkEntitlements(customerInfo);
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Error', e.message);
            }
        }
    };

    const restorePurchases = async () => {
        try {
            const info = await Purchases.restorePurchases();
            setCustomerInfo(info);
            checkEntitlements(info);
            Alert.alert('Success', 'Purchases restored!');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    return (
        <RevenueCatContext.Provider value={{ customerInfo, isPro, currentOffering, purchasePackage, restorePurchases, presentPaywall, presentPaywallIfNeeded }}>
            {children}
        </RevenueCatContext.Provider>
    );
};

export const useRevenueCat = () => {
    const context = useContext(RevenueCatContext);
    if (!context) {
        throw new Error('useRevenueCat must be used within a RevenueCatProvider');
    }
    return context;
};
