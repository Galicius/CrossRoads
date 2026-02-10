import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ScrollView, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEvents, Event } from '@/context/EventsContext';

const TABS = ['People', 'Events', 'Builders'];
const TAGS = [
    { name: 'Sports', icon: 'football-outline' },
    { name: 'Arts', icon: 'color-palette-outline' },
    { name: 'Tech', icon: 'hardware-chip-outline' },
    { name: 'Music', icon: 'musical-notes-outline' }
];

// Placeholder illustration for events where no specific image is provided
const DEFAULT_ILLUSTRATION = 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80';

export default function SocialFeedScreen() {
    const insets = useSafeAreaInsets();
    const { allEvents, createEvent, joinEvent } = useEvents();
    const [activeTab, setActiveTab] = useState('Events');
    const [peopleData, setPeopleData] = useState<any[]>([]);
    const [builderData, setBuilderData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Filter State
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Add Event State
    const [addEventModalVisible, setAddEventModalVisible] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [newEventLocation, setNewEventLocation] = useState('');
    const [newEventCategory, setNewEventCategory] = useState('');

    useEffect(() => {
        // Fetch other non-event data if needed
        if (activeTab === 'People' && peopleData.length === 0) {
            setPeopleData([
                { id: '1', name: 'Jake', activity: 'Climbing', bio: 'Looking for a belay partner!' },
                { id: '2', name: 'Sarah', activity: 'Skiing', bio: 'Heading to Tahoe this weekend.' },
            ]);
        } else if (activeTab === 'Builders' && builderData.length === 0) {
            setBuilderData([
                { id: '1', name: 'TechHub', location: 'Downtown', description: 'Co-working space for founders.' }
            ]);
        }
    }, [activeTab]);

    const getFilteredData = () => {
        let currentData: any[] = [];

        if (activeTab === 'Events') {
            currentData = allEvents;
        } else if (activeTab === 'People') {
            currentData = peopleData;
        } else if (activeTab === 'Builders') {
            currentData = builderData;
        }

        // Filter by Search
        if (searchText) {
            const lower = searchText.toLowerCase();
            currentData = currentData.filter(item =>
                (item.title || item.name || '').toLowerCase().includes(lower) ||
                (item.description || item.bio || '').toLowerCase().includes(lower)
            );
        }

        // Filter by Category (only for Events)
        if (activeTab === 'Events' && selectedCategories.length > 0) {
            currentData = currentData.filter(item => selectedCategories.includes(item.category));
        }

        return currentData;
    };

    const handleAddEvent = () => {
        if (!newEventTitle || !newEventCategory) return;

        const newEvent: Event = {
            id: Date.now().toString(),
            title: newEventTitle,
            description: newEventDesc,
            time: newEventTime || 'TBD',
            location: newEventLocation || 'TBD',
            image_url: DEFAULT_ILLUSTRATION,
            category: newEventCategory,
            isCustom: true,
            joined: true // Auto-join own event
        };

        createEvent(newEvent);
        resetAddEventForm();
        setAddEventModalVisible(false);
    };

    const resetAddEventForm = () => {
        setNewEventTitle('');
        setNewEventDesc('');
        setNewEventTime('');
        setNewEventLocation('');
        setNewEventCategory('');
    };

    const toggleFilterCategory = (catName: string) => {
        if (selectedCategories.includes(catName)) {
            setSelectedCategories(selectedCategories.filter(c => c !== catName));
        } else {
            setSelectedCategories([...selectedCategories, catName]);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        if (activeTab === 'Events') {
            const eventItem = item as Event;
            return (
                <View style={styles.eventCard}>
                    <Image source={{ uri: eventItem.image_url }} style={styles.eventImage} />
                    <View style={styles.eventContent}>
                        <View style={styles.titleRow}>
                            <Text style={styles.eventTitle}>{eventItem.title}</Text>
                            {eventItem.category && (
                                <View style={styles.categoryBadgeSmall}>
                                    <Text style={styles.categoryBadgeTextSmall}>{eventItem.category}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.eventDesc} numberOfLines={2}>{eventItem.description}</Text>

                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={16} color="#5B7FFF" />
                            <Text style={styles.infoText}>{eventItem.time}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color="#5B7FFF" />
                            <Text style={styles.infoText}>{eventItem.location}</Text>
                        </View>

                        {/* Join Button */}
                        <TouchableOpacity
                            style={[
                                styles.joinButton,
                                eventItem.joined && styles.joinedButton
                            ]}
                            onPress={() => !eventItem.joined && joinEvent(eventItem.id)}
                            disabled={eventItem.joined}
                        >
                            <Text style={[
                                styles.joinButtonText,
                                eventItem.joined && styles.joinedButtonText
                            ]}>
                                {eventItem.joined ? 'Joined' : 'Join Group'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Fallback for other tabs
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

            {/* Main Content Area */}
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
                    <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
                        <Ionicons name="options-outline" size={24} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Selected Filters / 'All' Display */}
                <View style={styles.tagsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {selectedCategories.length === 0 ? (
                            <View style={styles.tagBadge}>
                                <Ionicons name="layers-outline" size={16} color="white" style={{ marginRight: 6 }} />
                                <Text style={styles.tagText}>All</Text>
                            </View>
                        ) : (
                            selectedCategories.map((cat, index) => {
                                const tagInfo = TAGS.find(t => t.name === cat);
                                return (
                                    <View key={index} style={styles.tagBadge}>
                                        <Ionicons name={(tagInfo?.icon || 'pricetag-outline') as any} size={16} color="white" style={{ marginRight: 6 }} />
                                        <Text style={styles.tagText}>{cat}</Text>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>

                {/* List */}
                <FlatList
                    data={getFilteredData()}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Floating Action Button */}
            {activeTab === 'Events' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: insets.bottom + 80 }]} // Adjusted to be above navbar
                    onPress={() => setAddEventModalVisible(true)}
                >
                    <Ionicons name="add" size={32} color="white" />
                </TouchableOpacity>
            )}

            {/* Filter Modal */}
            <Modal
                visible={filterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Filter Categories</Text>
                                <View style={styles.categoriesGrid}>
                                    {TAGS.map(tag => (
                                        <TouchableOpacity
                                            key={tag.name}
                                            style={[
                                                styles.categoryOption,
                                                selectedCategories.includes(tag.name) && styles.categoryOptionSelected
                                            ]}
                                            onPress={() => toggleFilterCategory(tag.name)}
                                        >
                                            <Ionicons
                                                name={tag.icon as any}
                                                size={24}
                                                color={selectedCategories.includes(tag.name) ? 'white' : '#5B7FFF'}
                                            />
                                            <Text style={[
                                                styles.categoryOptionText,
                                                selectedCategories.includes(tag.name) && styles.categoryOptionTextSelected
                                            ]}>
                                                {tag.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TouchableOpacity style={styles.modalButton} onPress={() => setFilterModalVisible(false)}>
                                    <Text style={styles.modalButtonText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Add Event Modal */}
            <Modal
                visible={addEventModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAddEventModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Event</Text>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.inputLabel}>Title</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Event Name"
                                value={newEventTitle}
                                onChangeText={setNewEventTitle}
                            />

                            <Text style={styles.inputLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                                {TAGS.map(tag => (
                                    <TouchableOpacity
                                        key={tag.name}
                                        style={[
                                            styles.categoryChip,
                                            newEventCategory === tag.name && styles.categoryChipSelected
                                        ]}
                                        onPress={() => setNewEventCategory(tag.name)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            newEventCategory === tag.name && styles.categoryChipTextSelected
                                        ]}>{tag.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                placeholder="What's happening?"
                                multiline
                                numberOfLines={3}
                                value={newEventDesc}
                                onChangeText={setNewEventDesc}
                            />

                            <Text style={styles.inputLabel}>Time</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. 10:00 AM - 2:00 PM"
                                value={newEventTime}
                                onChangeText={setNewEventTime}
                            />

                            <Text style={styles.inputLabel}>Location</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. Central Park"
                                value={newEventLocation}
                                onChangeText={setNewEventLocation}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setAddEventModalVisible(false);
                                    resetAddEventForm();
                                }}
                            >
                                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handleAddEvent}>
                                <Text style={styles.modalButtonText}>Create Event</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: -3,
        zIndex: 10
    },
    tab: {
        paddingBottom: 15,
        position: 'relative',
    },
    activeTab: {},
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
        backgroundColor: '#5B7FFF',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2
    },
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
        backgroundColor: '#5659ab',
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
    eventCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A1A',
        flex: 1,
    },
    categoryBadgeSmall: {
        backgroundColor: '#F0F0F8',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    categoryBadgeTextSmall: {
        fontSize: 10,
        color: '#5B7FFF',
        fontWeight: 'bold',
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
    joinButton: {
        backgroundColor: '#5B7FFF',
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        alignItems: 'center',
    },
    joinedButton: {
        backgroundColor: '#E0E0E0',
    },
    joinButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    joinedButtonText: {
        color: '#888',
    },
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

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#5B7FFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333'
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 20,
    },
    categoryOption: {
        width: '45%',
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#F5F5FA',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    categoryOptionSelected: {
        backgroundColor: '#5B7FFF',
        borderColor: '#5B7FFF',
    },
    categoryOptionText: {
        marginTop: 8,
        fontWeight: '600',
        color: '#5B7FFF',
    },
    categoryOptionTextSelected: {
        color: 'white',
    },
    modalButton: {
        backgroundColor: '#5B7FFF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Add Event Specific
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 10,
    },
    modalInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    categorySelector: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryChipSelected: {
        backgroundColor: '#5B7FFF',
        borderColor: '#5B7FFF',
    },
    categoryChipText: {
        color: '#666',
        fontWeight: '600',
    },
    categoryChipTextSelected: {
        color: 'white',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        justifyContent: 'space-between'
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
        flex: 1,
    },
    cancelButtonText: {
        color: '#666',
    },
});
