import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';

const TABS = ['People', 'Events', 'Builders'];
const TAGS = [
    { name: 'Sports', icon: 'football-outline' },
    { name: 'Arts', icon: 'color-palette-outline' },
    { name: 'Tech', icon: 'hardware-chip-outline' },
    { name: 'Music', icon: 'musical-notes-outline' }
];

export default function SocialFeedScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('Events'); // Default to Events as per image focus
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    async function fetchData() {
        setLoading(true);
        try {
            if (activeTab === 'People') {
                setData([
                    { id: '1', name: 'Jake', activity: 'Climbing', bio: 'Looking for a belay partner!' },
                    { id: '2', name: 'Sarah', activity: 'Skiing', bio: 'Heading to Tahoe this weekend.' },
                ]);
            } else if (activeTab === 'Events') {
                // Mock events to match the "Sunrise Yoga" style if DB is empty or for demo
                // const { data: events } = await supabase.from('events').select('*');
                // if (events && events.length > 0) setData(events);
                // else 
                setData([
                    {
                        id: '1',
                        title: 'Sunrise Yoga',
                        description: 'Relax with me at sunrise yoga this Saturday! We\'ll have a great time.',
                        time: '5.45 - 7.10 AM',
                        location: 'Paris, France',
                        image_url: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                    },
                    {
                        id: '2',
                        title: 'City Cycling',
                        description: 'Join us for a 20km ride around the city center.',
                        time: '9.00 - 11.00 AM',
                        location: 'Central Park',
                        image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                    }
                ]);
            } else if (activeTab === 'Builders') {
                setData([
                    { id: '1', name: 'TechHub', location: 'Downtown', description: 'Co-working space for founders.' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'Events') {
            return (
                <View style={styles.eventCard}>
                    <Image source={{ uri: item.image_url }} style={styles.eventImage} />
                    <View style={styles.eventContent}>
                        <Text style={styles.eventTitle}>{item.title}</Text>
                        <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>

                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={16} color="#5B7FFF" />
                            <Text style={styles.infoText}>{item.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color="#5B7FFF" />
                            <Text style={styles.infoText}>{item.location}</Text>
                        </View>
                    </View>
                </View>
            );
        }

        // Fallback for other tabs (simple list for now)
        return (
            <View style={styles.simpleCard}>
                <Text style={styles.cardTitle}>{item.name || item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.activity || item.location}</Text>
                <Text style={styles.cardDesc}>{item.bio || item.description}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header Area */}
            <View style={styles.headerArea}>
                <View style={styles.headerTop}>
                    <Text style={styles.screenTitle}>Discover</Text>


                </View>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab}
                            </Text>
                            {activeTab === tab && <View style={styles.activeLine} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Main Content Area - White rounded container */}
            <View style={styles.contentContainer}>
                {/* Search & Filter */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Find groups and events..."
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                    <TouchableOpacity style={styles.filterBtn}>
                        <Ionicons name="options-outline" size={24} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Tags */}
                <View style={styles.tagsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {TAGS.map((tag, index) => (
                            <TouchableOpacity key={index} style={styles.tagBadge}>
                                <Ionicons name={tag.icon as any} size={16} color="white" style={{ marginRight: 6 }} />
                                <Text style={styles.tagText}>{tag.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List */}
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5EA',

    },
    headerArea: {
        paddingHorizontal: 20,
        paddingBottom: 0,
        paddingTop: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },


    screenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginTop: 10,
        marginBottom: 10,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 30,
        paddingLeft: 5,
        marginBottom: -3, // Pull tabs down slightly so underline overlaps content container details
        zIndex: 10
    },
    tab: {
        paddingBottom: 15,
        position: 'relative',
    },
    activeTab: {
        // Active state handled by line
    },
    tabText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
    },
    activeTabText: {
        color: '#1A1A1A',
    },
    activeLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#5B7FFF', // Match chat violet/blue
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2
    },

    // Content Container
    contentContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 25,
        overflow: 'hidden',
    },
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 46,
        // Shadow for floating effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    filterBtn: {
        padding: 5,
    },

    tagsContainer: {
        marginBottom: 20,
        height: 32,
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5659ab', // Darker violet/blue
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
    },
    tagText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 13,
    },

    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },

    // Event Card Style
    eventCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        // Card shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f8f8f8',
    },
    eventImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#ddd',
    },
    eventContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    eventTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    eventDesc: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 10,
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },

    // Simple Card Fallback
    simpleCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold' },
    cardSubtitle: { color: '#666', marginVertical: 4 },
    cardDesc: { color: '#444' },
});
