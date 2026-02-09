import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

const TABS = ['People', 'Events', 'Builders'];

export default function SocialFeedScreen() {
    const [activeTab, setActiveTab] = useState('People');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    async function fetchData() {
        setLoading(true);
        try {
            if (activeTab === 'People') {
                // Mock people for now or fetch profiles
                setData([
                    { id: '1', name: 'Jake', activity: 'Climbing', location: { latitude: 37.78825, longitude: -122.4324 }, bio: 'Looking for a belay partner at Mission Cliffs!' },
                    { id: '2', name: 'Sarah', activity: 'Skiing', location: { latitude: 37.75825, longitude: -122.4624 }, bio: 'Heading to Tahoe this weekend. Anyone want to caravan?' },
                ]);
            } else if (activeTab === 'Events') {
                const { data: events, error } = await supabase.from('events').select('*').order('start_time', { ascending: true });
                if (events) setData(events);
            } else if (activeTab === 'Builders') {
                const { data: builders, error } = await supabase.from('builders').select('*');
                if (builders) setData(builders);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'People') {
            return (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.activityBadge}>{item.activity}</Text>
                    </View>
                    <Text style={styles.bio}>{item.bio}</Text>
                    <TouchableOpacity style={styles.connectBtn}>
                        <Text style={styles.connectText}>Connect</Text>
                    </TouchableOpacity>
                </View>
            );
        } else if (activeTab === 'Events') {
            return (
                <View style={styles.eventCard}>
                    <Image source={{ uri: item.image_url }} style={styles.eventImage} />
                    <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventLocation}>📍 {item.location}</Text>
                        <Text style={styles.eventTime}>📅 {new Date(item.start_time).toLocaleDateString()}</Text>
                        <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                        <TouchableOpacity style={styles.joinBtn}>
                            <Text style={styles.joinBtnText}>Join Event</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        } else if (activeTab === 'Builders') {
            return (
                <View style={styles.builderCard}>
                    <Image source={{ uri: item.logo_url }} style={styles.builderLogo} />
                    <View style={styles.builderContent}>
                        <Text style={styles.builderName}>{item.name}</Text>
                        <Text style={styles.builderLocation}>🛠️ {item.location}</Text>
                        <Text style={styles.builderDesc} numberOfLines={2}>{item.description}</Text>
                        {item.website && (
                            <TouchableOpacity onPress={() => Linking.openURL(item.website)}>
                                <Text style={styles.websiteLink}>Visit Website</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            );
        }
        return null;
    };

    const handleTabChange = (tab: string) => {
        setData([]); // Clear data immediately to prevent rendering old data with new template
        setActiveTab(tab);
    };

    return (
        <View style={styles.container}>
            {/* Header / Tabs */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover</Text>
                <View style={styles.tabContainer}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => handleTabChange(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* View Toggle (Only relevant for People/Events maybe, kept simple for now) */}
            {/* <View style={styles.toggleContainer}> ... </View> */}

            {/* Content */}
            <FlatList
                key={activeTab} // Force re-mount on tab change!
                data={data}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={fetchData}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { backgroundColor: 'white', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    tabContainer: { flexDirection: 'row', gap: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f0f0f0' },
    activeTab: { backgroundColor: '#333' },
    tabText: { fontWeight: '600', color: '#666' },
    activeTabText: { color: 'white' },

    listContent: { padding: 15 },

    // People Card
    card: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontSize: 18, fontWeight: 'bold' },
    activityBadge: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    bio: { color: '#666', marginBottom: 15, lineHeight: 20 },
    connectBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 10, alignItems: 'center' },
    connectText: { color: 'white', fontWeight: 'bold' },

    // Event Card
    eventCard: { backgroundColor: 'white', borderRadius: 15, marginBottom: 15, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    eventImage: { width: '100%', height: 150 },
    eventContent: { padding: 15 },
    eventTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    eventLocation: { color: '#666', fontSize: 14, marginBottom: 5 },
    eventTime: { color: '#5659ab', fontWeight: '600', marginBottom: 10 },
    eventDesc: { color: '#444', marginBottom: 15, lineHeight: 20 },
    joinBtn: { borderWidth: 1, borderColor: '#5659ab', borderRadius: 10, padding: 10, alignItems: 'center' },
    joinBtnText: { color: '#5659ab', fontWeight: 'bold' },

    // Builder Card
    builderCard: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    builderLogo: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#eee' },
    builderContent: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    builderName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    builderLocation: { color: '#666', fontSize: 14, marginBottom: 5 },
    builderDesc: { color: '#444', fontSize: 13, marginBottom: 5 },
    websiteLink: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
});
