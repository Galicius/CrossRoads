import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuildersStackParamList } from './BuildersStack';
import { IconSymbol } from '@/components/ui/IconSymbol';

type NavigationProp = NativeStackNavigationProp<BuildersStackParamList>;

export default function BuilderDirectoryScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [activeTab, setActiveTab] = useState<'builders' | 'my_requests'>('builders');
    const [builders, setBuilders] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock Location for now
    const userLocation = { latitude: 46.0569, longitude: 14.5058 };

    useEffect(() => {
        if (activeTab === 'builders') fetchBuilders();
        else fetchMyRequests();
    }, [activeTab]);

    const fetchBuilders = async () => {
        setLoading(true);
        // Call RPC function if it exists, otherwise fall back to basic select
        // For simplicity in this step, we use basic select filters
        const { data, error } = await supabase
            .from('builder_profiles')
            .select('*')
            .eq('is_active', true);

        if (data) setBuilders(data);
        setLoading(false);
    };

    const fetchMyRequests = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('help_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setRequests(data);
        }
        setLoading(false);
    };

    const renderBuilder = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BuilderProfile', { builderId: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>{item.business_name}</Text>
                    {item.is_verified && (
                        <IconSymbol name="checkmark.seal.fill" size={16} color="#1DA1F2" style={{ marginLeft: 4 }} />
                    )}
                </View>
                <Text style={styles.rate}>${item.hourly_rate}/hr</Text>
            </View>
            <View style={styles.chips}>
                {item.expertise?.slice(0, 3).map((ex: string) => (
                    <Text key={ex} style={styles.chipText}>{ex}</Text>
                ))}
            </View>
            <Text style={styles.radius}>Travels: {item.travel_radius_km}km</Text>
        </TouchableOpacity>
    );

    const renderRequest = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RequestDetails', { requestId: item.id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.category}</Text>
                <View style={[styles.statusBadge,
                item.status === 'open' ? { backgroundColor: '#e3f2fd' } :
                    item.status === 'in_progress' ? { backgroundColor: '#fff3e0' } : { backgroundColor: '#e8f5e9' }
                ]}>
                    <Text style={{ color: '#333', fontSize: 12 }}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
            <Text numberOfLines={2} style={styles.desc}>{item.description}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header / Tabs */}
            <View style={styles.header}>
                <Text style={styles.title}>Builders</Text>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'builders' && styles.activeTab]}
                        onPress={() => setActiveTab('builders')}
                    >
                        <Text style={[styles.tabText, activeTab === 'builders' && styles.activeTabText]}>Find Help</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my_requests' && styles.activeTab]}
                        onPress={() => setActiveTab('my_requests')}
                    >
                        <Text style={[styles.tabText, activeTab === 'my_requests' && styles.activeTabText]}>My Jobs</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <View style={styles.content}>
                {activeTab === 'builders' ? (
                    <FlatList
                        data={builders}
                        keyExtractor={item => item.id}
                        renderItem={renderBuilder}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.empty}>No builders found nearby.</Text>}
                    />
                ) : (
                    <FlatList
                        data={requests}
                        keyExtractor={item => item.id}
                        renderItem={renderRequest}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.empty}>You haven't posted any jobs yet.</Text>}
                    />
                )}
            </View>

            {/* FABs */}
            <View style={styles.fabs}>
                {/* Become a Builder (Small) */}
                <TouchableOpacity
                    style={styles.fabSmall}
                    onPress={() => navigation.navigate('BuilderRegistration')}
                >
                    <IconSymbol name="person.crop.circle.badge.plus" size={24} color="white" />
                </TouchableOpacity>

                {/* Ask for Help (Large) */}
                <TouchableOpacity
                    style={styles.fabLarge}
                    onPress={() => navigation.navigate('CreateRequest')}
                >
                    <IconSymbol name="plus" size={30} color="white" />
                    <Text style={styles.fabText}>Ask for Help</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    tabs: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 3 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    tabText: { fontWeight: '600', color: 'gray' },
    activeTabText: { color: 'black' },
    content: { flex: 1 },
    list: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontSize: 17, fontWeight: 'bold' },
    rate: { color: 'green', fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 5 },
    chipText: { fontSize: 12, color: '#666', marginRight: 8, backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    radius: { fontSize: 12, color: '#999', marginTop: 5 },
    desc: { color: '#444', marginBottom: 8 },
    date: { fontSize: 12, color: '#999' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    empty: { textAlign: 'center', marginTop: 40, color: 'gray' },
    fabs: { position: 'absolute', bottom: 30, right: 20, alignItems: 'flex-end' },
    fabLarge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6347', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 5, marginTop: 15 },
    fabText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    fabSmall: { backgroundColor: '#444', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});
