import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { BuildersStackParamList } from './BuildersStack';
import { IconSymbol } from '@/components/ui/IconSymbol';

type BuilderProfileRouteProp = RouteProp<BuildersStackParamList, 'BuilderProfile'>;

export default function BuilderProfileScreen() {
    const route = useRoute<BuilderProfileRouteProp>();
    const navigation = useNavigation<any>();
    const { builderId } = route.params;
    const [builder, setBuilder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messagingLoading, setMessagingLoading] = useState(false);

    useEffect(() => {
        const fetchBuilder = async () => {
            const { data, error } = await supabase
                .from('builder_profiles')
                .select('*')
                .eq('id', builderId)
                .single();

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setBuilder(data);
            }
            setLoading(false);
        };
        fetchBuilder();
    }, [builderId]);

    const handleMessage = async () => {
        try {
            setMessagingLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Error', 'You need to be logged in to message a builder.');
                return;
            }

            // Use the existing create_builder_chat RPC function
            const { data: chatId, error } = await supabase.rpc('create_builder_chat', {
                p_builder_id: builderId,
                p_user_id: user.id,
            });

            if (error) throw error;

            if (chatId) {
                // Fetch builder name for chat header
                const builderName = builder?.business_name || 'Builder';
                navigation.navigate('ChatDetail', {
                    chatId: chatId,
                    otherUserName: builderName,
                });
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Could not start chat.');
        } finally {
            setMessagingLoading(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
    if (!builder) return <View style={styles.center}><Text>Builder not found</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.contentArea}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{builder.business_name}</Text>
                    {builder.is_verified && (
                        <IconSymbol name="checkmark.seal.fill" size={24} color="#1DA1F2" style={{ marginLeft: 6 }} />
                    )}
                </View>
                <Text style={styles.rate}>${builder.hourly_rate}/hr</Text>

                <View style={styles.chips}>
                    {builder.expertise?.map((ex: string) => (
                        <View key={ex} style={styles.chip}>
                            <Text>{ex}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.bio}>{builder.bio}</Text>

                <Text style={styles.radius}>Travels up to {builder.travel_radius_km} km</Text>
            </View>

            {/* Message Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={handleMessage}
                    disabled={messagingLoading}
                >
                    {messagingLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <IconSymbol name="message.fill" size={20} color="white" />
                            <Text style={styles.messageBtnText}>Message Builder</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    contentArea: { flex: 1, padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 24, fontWeight: 'bold' },
    rate: { fontSize: 18, color: 'green', marginVertical: 5 },
    bio: { fontSize: 16, marginTop: 15, lineHeight: 24 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    chip: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 5, marginBottom: 5 },
    radius: { marginTop: 20, color: 'gray', fontStyle: 'italic' },

    // Bottom bar with message button
    bottomBar: {
        padding: 16,
        paddingBottom: 30,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: 'white',
    },
    messageBtn: {
        backgroundColor: '#5659ab',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#5659ab',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    messageBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
