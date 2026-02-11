import React, { createContext, useContext, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// Use your actual RevenueCat API Keys here
const APIKeys = {
    apple: 'appl_...', // Placeholder if you have iOS
    google: 'goog_bpvXRjYOaPVMMnymtWNJNWisbbL',
};

const ENTITLEMENT_ID = 'CrossRoads Pro';

interface RevenueCatContextType {
    customerInfo: CustomerInfo | null;
    isPro: boolean;
    currentOffering: PurchasesPackage[] | null;
    purchasePackage: (pack: PurchasesPackage) => Promise<void>;
    restorePurchases: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [currentOffering, setCurrentOffering] = useState<PurchasesPackage[] | null>(null);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (Platform.OS === 'android') {
                await Purchases.configure({ apiKey: APIKeys.google });
            } else {
                await Purchases.configure({ apiKey: APIKeys.google });
            }

            const info = await Purchases.getCustomerInfo();
            setCustomerInfo(info);
            checkEntitlements(info);

            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current && offerings.current.availablePackages.length !== 0) {
                    setCurrentOffering(offerings.current.availablePackages);
                }
            } catch (e) {
                console.error('Error fetching offerings', e);
            }
        };

        init();

        // Listen for customer info changes (e.g. purchase completed, restored, etc.)
        Purchases.addCustomerInfoUpdateListener((info) => {
            setCustomerInfo(info);
            checkEntitlements(info);
        });
    }, []);

    const checkEntitlements = async (info: CustomerInfo) => {
        const pro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsPro(pro);

        // Sync verification status if user is a builder
        if (pro) {
            syncBuilderVerification();
        }
    };

    const syncBuilderVerification = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if user is a builder
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
            console.log('Error syncing builder verification:', error);
        }
    }

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
        <RevenueCatContext.Provider value={{ customerInfo, isPro, currentOffering, purchasePackage, restorePurchases }}>
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
