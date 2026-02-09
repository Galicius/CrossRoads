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
                .order('created_at', { ascending: true });

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
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe();
    };

    const sendMessage = async () => {
        if (!text.trim() || !currentUser) return;

        const content = text.trim();
        setText('');

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: currentUser.id,
                    content: content,
                    type: 'text' // Assuming 'type' column exists based on schema inspection
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            // Optionally restore text to input
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator /></View>;
    }

    return (
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
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isMe = item.sender_id === currentUser?.id;
                    return (
                        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
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
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backButton: { marginRight: 15 },
    backButtonText: { color: '#007AFF', fontSize: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    listContent: { padding: 15 },
    messageBubble: { padding: 10, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
    myMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
    theirMessage: { alignSelf: 'flex-start', backgroundColor: '#E5E5EA' },
    myMessageText: { color: '#fff' },
    theirMessageText: { color: '#000' },
    inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
    input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
    sendButton: { padding: 10 },
    sendButtonText: { color: '#007AFF', fontWeight: 'bold' },
});
