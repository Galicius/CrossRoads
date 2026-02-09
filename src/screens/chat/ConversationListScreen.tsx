import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

type ChatType = 'dating' | 'builder';

export default function ConversationListScreen() {
    const navigation = useNavigation<any>();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ChatType>('dating');

    useEffect(() => {
        loadConversations();
        const unsubscribe = navigation.addListener('focus', loadConversations);
        return unsubscribe;
    }, [navigation, activeTab]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get chats I belong to
            const { data: myChats, error: chatError } = await supabase
                .from('chat_participants')
                .select('chat_id, chats(type)')
                .eq('user_id', user.id);

            if (chatError) throw chatError;

            // Filter by type
            const filteredChats = myChats?.filter((c: any) => c.chats?.type === activeTab) || [];
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
            const formatted = participants?.map((p: any) => ({
                id: p.chat_id,
                otherUser: p.profiles,
                lastMessage: 'Chat now!',
                time: ''
            })) || [];

            setConversations(formatted);

        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <IconSymbol name="magnifyingglass" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: '#999' }}>
                        {activeTab === 'dating' ? 'No matches yet. Go swipe!' : 'No builder chats yet.'}
                    </Text>
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
                                otherUserName: item.otherUser?.name || item.otherUser?.username || 'User'
                            })}
                        >
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    {item.otherUser?.images && item.otherUser.images[0] ? (
                                        <Image source={{ uri: item.otherUser.images[0] }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Text style={styles.avatarPlaceholderText}>
                                                {(item.otherUser?.name || item.otherUser?.username || 'A')[0].toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {/* Online status indicator */}
                                <View style={styles.onlineIndicator} />
                            </View>

                            <View style={styles.content}>
                                <View style={styles.row}>
                                    <Text style={styles.name}>{item.otherUser?.name || item.otherUser?.username || 'Anonymous'}</Text>
                                    <Text style={styles.time}>{item.time || '5 min'}</Text>
                                </View>
                                <View style={styles.messageRow}>
                                    <Text style={styles.message} numberOfLines={2}>{item.lastMessage}</Text>
                                    {/* Unread badge */}
                                    {Math.random() > 0.5 && (
                                        <View style={styles.unreadBadge}>
                                            <Text style={styles.unreadText}>1</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab}>
                <IconSymbol name="plus" size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 20
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#F8F9FA'
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1A1A1A'
    },
    searchButton: {
        padding: 8
    },
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
    unreadBadge: {
        backgroundColor: '#5B7FFF',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8
    },
    unreadText: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold'
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF2D92',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
    }
});
