import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

type ChatScreenRouteProp = RouteProp<{ ChatDetail: { chatId: string; otherUserName: string } }, 'ChatDetail'>;

export default function ChatScreen() {
    const route = useRoute<ChatScreenRouteProp>();
    const navigation = useNavigation();
    const { chatId, otherUserName } = route.params || {};

    const [messages, setMessages] = useState<any[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (otherUserName) {
            navigation.setOptions({ title: otherUserName });
        }
        loadMessages();
        const subscription = subscribeToMessages();
        return () => {
            subscription.unsubscribe();
        };
    }, [chatId]);

    const loadMessages = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: false }); // Order descending for inverted list

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        return supabase
            .channel(`chat:${chatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`,
                },
                (payload) => {
                    // Only add if not already in list (to avoid duplicate from optimistic update)
                    setMessages((prev) => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [payload.new, ...prev]; // Add to start for inverted list
                    });
                }
            )
            .subscribe();
    };

    const sendMessage = async () => {
        if (!text.trim() || !currentUser) return;

        const content = text.trim();
        setText('');

        // Optimistic Update
        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            chat_id: chatId,
            sender_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
            pending: true
        };

        setMessages(prev => [optimisticMessage, ...prev]);

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: currentUser.id,
                    content: content,
                    type: 'text'
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? data : m));

        } catch (error) {
            console.error('Error sending message:', error);
            // Ideally notify user and allow retry
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator /></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
                </View>

                <FlatList
                    data={messages}
                    inverted // Scroll from bottom up
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isMe = item.sender_id === currentUser?.id;
                        return (
                            <View style={[
                                styles.messageBubble,
                                isMe ? styles.myMessage : styles.theirMessage,
                                item.pending && { opacity: 0.7 }
                            ]}>
                                <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>{item.content}</Text>
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Type a message..."
                        returnKeyType="send"
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 50 },
    backButton: { marginRight: 15 },
    backButtonText: { color: '#007AFF', fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    listContent: { padding: 15 },
    messageBubble: { padding: 10, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#E5E5EA' },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: '#000' },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center', backgroundColor: 'white' },
    input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
    sendButton: { padding: 10 },
    sendButtonText: { color: '#007AFF', fontWeight: 'bold' },
});
