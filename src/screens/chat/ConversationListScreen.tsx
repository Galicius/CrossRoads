import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

export default function ConversationListScreen() {
    const navigation = useNavigation<any>();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConversations();

        // Subscribe to new chats? For now just load on mount.
        const unsubscribe = navigation.addListener('focus', loadConversations);
        return unsubscribe;
    }, [navigation]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get chats I belong to
            const { data: myChats, error: chatError } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', user.id);

            if (chatError) throw chatError;

            const chatIds = myChats?.map(c => c.chat_id) || [];

            if (chatIds.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            // 2. Get the OTHER participants in these chats
            // We want: chat_id, profile:profiles(*)
            // Note: This assumes 1-on-1 chats mostly.
            const { data: participants, error: partError } = await supabase
                .from('chat_participants')
                .select('chat_id, profiles:user_id(*)') // select profiles info joined by user_id
                .in('chat_id', chatIds)
                .neq('user_id', user.id);

            if (partError) throw partError;

            // Transform data
            const formatted = participants?.map((p: any) => ({
                id: p.chat_id,
                otherUser: p.profiles,
                lastMessage: 'Chat now!', // Placeholder until message fetch implemented
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
            <Text style={styles.headerTitle}>Messages</Text>
            {conversations.length === 0 ? (
                <View style={styles.center}>
                    <Text style={{ color: '#999' }}>No matches yet. Go swipe!</Text>
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
                            <View style={styles.avatar}>
                                {item.otherUser?.images && item.otherUser.images[0] ? (
                                    <Image source={{ uri: item.otherUser.images[0] }} style={styles.avatarImage} />
                                ) : null}
                            </View>
                            <View style={styles.content}>
                                <View style={styles.row}>
                                    <Text style={styles.name}>{item.otherUser?.name || item.otherUser?.username || 'Anonymous'}</Text>
                                    <Text style={styles.time}>{item.time}</Text>
                                </View>
                                <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
    item: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ddd', marginRight: 15, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    content: { flex: 1, justifyContent: 'center' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontWeight: 'bold', fontSize: 16 },
    time: { color: 'gray', fontSize: 12 },
    message: { color: 'gray' },
});
