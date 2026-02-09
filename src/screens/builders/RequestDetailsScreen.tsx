import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { BuildersStackParamList } from './BuildersStack';
import Purchases from 'react-native-purchases';

type RequestDetailsRouteProp = RouteProp<BuildersStackParamList, 'RequestDetails'>;

export default function RequestDetailsScreen() {
    const route = useRoute<RequestDetailsRouteProp>();
    const { requestId } = route.params;
    const [request, setRequest] = useState<any>(null);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        try {
            const { data: reqData, error: reqError } = await supabase
                .from('help_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (reqError) throw reqError;
            setRequest(reqData);

            const { data: offersData, error: offersError } = await supabase
                .from('help_offers')
                .select('*, builder_profiles(*)')
                .eq('request_id', requestId);

            if (offersError) throw offersError;
            setOffers(offersData || []);

        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const acceptOffer = async (offerId: string, builderId: string) => {
        try {
            // 1. Trigger RevenueCat Paywall (Simulated for now if not set up)
            // In production:
            // const offerings = await Purchases.getOfferings();
            // const package = offerings.current?.availablePackages[0]; // Assuming a 'connection_fee' package
            // if (package) {
            //   await Purchases.purchasePackage(package);
            // }

            Alert.alert(
                "Confirm Connection Fee",
                "A small fee applies to connect with this expert. Proceed?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Pay & Connect",
                        onPress: async () => {
                            // 2. Update Request Status
                            const { error } = await supabase
                                .from('help_requests')
                                .update({ status: 'in_progress', selected_builder_id: builderId })
                                .eq('id', requestId);

                            if (error) throw error;

                            // 3. Update Offer Status
                            await supabase
                                .from('help_offers')
                                .update({ status: 'accepted' })
                                .eq('id', offerId);

                            Alert.alert('Success', 'You are now connected! The builder has been notified.');
                            fetchDetails();
                        }
                    }
                ]
            );

        } catch (error: any) {
            if (!error.userCancelled) {
                Alert.alert('Payment Error', error.message);
            }
        }
    };

    if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;
    if (!request) return <View style={styles.container}><Text>Request not found.</Text></View>;

    return (
        <View style={styles.container}>
            <Text style={styles.category}>{request.category}</Text>
            <Text style={styles.desc}>{request.description}</Text>
            <Text style={styles.status}>Status: {request.status}</Text>

            <Text style={styles.sectionHeader}>Offers from Builders</Text>
            <FlatList
                data={offers}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={styles.empty}>No offers yet. Hang tight!</Text>}
                renderItem={({ item }) => (
                    <View style={styles.offerCard}>
                        <View>
                            <Text style={styles.builderName}>{item.builder_profiles.business_name}</Text>
                            <Text>{item.message}</Text>
                            <Text style={styles.price}>Est. Rate: ${item.builder_profiles.hourly_rate}/hr</Text>
                        </View>
                        {request.status === 'open' && (
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptOffer(item.id, item.builder_id)}>
                                <Text style={styles.btnText}>Accept</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'accepted' && (
                            <Text style={styles.connected}>connected</Text>
                        )}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    category: { fontSize: 18, fontWeight: 'bold', color: '#FF6347' },
    desc: { fontSize: 16, marginVertical: 10 },
    status: { color: 'gray', marginBottom: 20 },
    sectionHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    empty: { fontStyle: 'italic', color: 'gray' },
    offerCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
    builderName: { fontWeight: 'bold', fontSize: 16 },
    price: { color: 'green', marginTop: 5 },
    acceptBtn: { backgroundColor: '#FF6347', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
    btnText: { color: 'white', fontWeight: 'bold' },
    connected: { color: 'green', fontWeight: 'bold' }
});
