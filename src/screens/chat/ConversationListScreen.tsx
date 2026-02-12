import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

type ChatType = 'dating' | 'social' | 'events' | 'builder';

const TABS: { key: ChatType; label: string; icon: any; emptyText: string }[] = [
    { key: 'dating', label: 'Dating', icon: 'heart', emptyText: 'No matches yet. Go swipe!' },
    { key: 'social', label: 'Social', icon: 'people', emptyText: 'No social chats yet. Connect with fellow travelers!' },
    { key: 'events', label: 'Events', icon: 'calendar', emptyText: 'No event chats yet. Join an event to start chatting!' },
    { key: 'builder', label: 'Builders', icon: 'construct', emptyText: 'No builder chats yet. Find help in the Builders tab!' },
];

export default function ConversationListScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [activeTab, setActiveTab] = useState<ChatType>('dating');

    // Handle initialTab from navigation params
    useEffect(() => {
        if (route.params?.initialTab) {
            setActiveTab(route.params.initialTab as ChatType);
            setInitialLoad(true);
        }
    }, [route.params?.initialTab]);

    useEffect(() => {
        loadConversations();
        const unsubscribe = navigation.addListener('focus', loadConversations);
        return unsubscribe;
    }, [navigation, activeTab]);

    const loadConversations = async () => {
        try {
            if (initialLoad) setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get chats I belong to
            const { data: myChats, error: chatError } = await supabase
                .from('chat_participants')
                .select('chat_id, chats(type, name)')
                .eq('user_id', user.id);

            if (chatError) throw chatError;

            // Filter by type
            const filteredChats = myChats?.filter((c: any) => {
                const type = c.chats?.type;
                if (activeTab === 'events') {
                    return type && type.startsWith('event_');
                }
                return type === activeTab;
            }) || [];
            const chatIds = filteredChats.map((c: any) => c.chat_id);

            if (chatIds.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            // 2. Get the OTHER participants in these chats
            const { data: participants, error: partError } = await supabase
                .from('chat_participants')
                .select('chat_id, profiles:user_id(*)')
                .in('chat_id', chatIds)
                .neq('user_id', user.id);

            if (partError) throw partError;

            // Transform data
            const formatted = participants?.map((p: any) => {
                // For events, the "otherUser" might technically be a mix, but for list display we can show the group name
                // If it's an event chat, use the chat name (event title)
                const isEvent = p.chat_id && filteredChats.find((fc: any) => fc.chat_id === p.chat_id)?.chats?.type?.startsWith('event_');
                // Use the chat name if event, otherwise user name.
                // We need to fetch chat details to get the name properly if we rely on 'profiles'.
                // Ideally, we previously fetched 'chats(type, name)'.
                const chatInfo = filteredChats.find((fc: any) => fc.chat_id === p.chat_id)?.chats;

                return {
                    id: p.chat_id,
                    otherUser: p.profiles,
                    chatName: isEvent ? chatInfo?.name : (p.profiles?.full_name || p.profiles?.username || 'User'),
                    isEvent,
                    lastMessage: 'Chat now!',
                    time: ''
                };
            }) || [];

            setConversations(formatted);

        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const activeTabConfig = TABS.find(t => t.key === activeTab)!;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <IconSymbol name="magnifyingglass" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                        onPress={() => {
                            setActiveTab(tab.key);
                            setInitialLoad(true);
                        }}
                    >
                        <Ionicons
                            name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
                            size={20}
                            color={activeTab === tab.key ? '#4d73ba' : '#8E8E93'}
                            style={{ marginBottom: 4 }}
                        />
                        <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                            {tab.label}
                        </Text>
                        {activeTab === tab.key && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#4d73ba" /></View>
            ) : conversations.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name={activeTabConfig.icon} size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyText}>{activeTabConfig.emptyText}</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => navigation.navigate('ChatDetail', {
                                chatId: item.id,
                                otherUserName: item.chatName || 'User'
                            })}
                        >
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    {item.otherUser?.images && item.otherUser.images[0] ? (
                                        <Image source={{ uri: item.otherUser.images[0] }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <TelegramIcon name={item.isEvent ? "calendar" : "person"} size={24} color="white" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.onlineIndicator} />
                            </View>

                            <View style={styles.content}>
                                <View style={styles.row}>
                                    <Text style={styles.name}>{item.chatName}</Text>
                                    <Text style={styles.time}>{item.time || '5 min'}</Text>
                                </View>
                                <View style={styles.messageRow}>
                                    <Text style={styles.message} numberOfLines={2}>{item.lastMessage}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: 'white'
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1A1A1A'
    },
    searchButton: {
        padding: 8
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        position: 'relative',
    },
    activeTab: {},
    tabIcon: {
        fontSize: 18,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#8E8E93',
    },
    activeTabLabel: {
        color: '#4d73ba',
        fontWeight: '700',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 3,
        backgroundColor: '#4d73ba',
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },

    // Empty state
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        color: '#999',
        fontSize: 15,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 22,
    },

    // List items
    item: {
        flexDirection: 'row',
        paddingVertical: 16,
        backgroundColor: 'white',
        marginBottom: 2,
        paddingHorizontal: 16
    },
    avatarContainer: {
        marginRight: 15,
        position: 'relative'
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E5E5EA',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarImage: {
        width: '100%',
        height: '100%'
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C7C7CC'
    },
    avatarPlaceholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white'
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#34C759',
        borderWidth: 2,
        borderColor: 'white'
    },
    content: {
        flex: 1,
        justifyContent: 'center'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
    },
    name: {
        fontWeight: '600',
        fontSize: 17,
        color: '#1A1A1A'
    },
    time: {
        color: '#8E8E93',
        fontSize: 14
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    message: {
        color: '#8E8E93',
        fontSize: 15,
        flex: 1,
        lineHeight: 20
    },
});

// Helper for icon if IconSymbol doesn't support generic names for this specific need,
// using Ionicons directly for the placeholder
function TelegramIcon({ name, size, color }: any) {
    return <Ionicons name={name} size={size} color={color} />;
}
