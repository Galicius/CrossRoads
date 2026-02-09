import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';



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
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerCenter}>
                        <View style={styles.headerAvatar}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80' }}
                                style={styles.headerAvatarImage}
                            />
                        </View>
                        <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToListButton}>
                        <IconSymbol name="xmark" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Messages Area with white background */}
                <View style={styles.messagesArea}>
                    {/* Messages List */}
                    <FlatList
                        data={messages}
                        inverted
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => {
                            const isMe = item.sender_id === currentUser?.id;
                            const showDate = index === messages.length - 1 ||
                                (messages[index + 1] &&
                                    new Date(item.created_at).toDateString() !== new Date(messages[index + 1].created_at).toDateString());

                            const time = new Date(item.created_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            });

                            return (
                                <View>
                                    {showDate && (
                                        <View style={styles.dateSeparator}>
                                            <Text style={styles.dateText}>Today</Text>
                                        </View>
                                    )}
                                    <View style={[
                                        styles.messageContainer,
                                        isMe ? styles.myMessageContainer : styles.theirMessageContainer
                                    ]}>
                                        <View style={[
                                            styles.messageBubble,
                                            isMe ? styles.myMessage : styles.theirMessage,
                                            item.pending && { opacity: 0.7 }
                                        ]}>
                                            <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>
                                                {item.content}
                                            </Text>
                                        </View>
                                        <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
                                            {time}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        contentContainerStyle={styles.listContent}
                    />
                </View>

                {/* Input Container */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.addButton}>
                        <IconSymbol name="plus.circle.fill" size={36} color="#5B7FFF" />
                    </TouchableOpacity>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={text}
                            onChangeText={setText}
                            placeholder="Message..."
                            placeholderTextColor="#8E8E93"
                            returnKeyType="send"
                            onSubmitEditing={sendMessage}
                            multiline
                        />
                        <TouchableOpacity style={styles.emojiButton}>
                            <IconSymbol name="face.smiling" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d4cbebff'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#d4cbebff'
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12
    },
    backToListButton: {
        padding: 4
    },
    messagesArea: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden'
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#E5E5EA'
    },
    headerAvatarImage: {
        width: '100%',
        height: '100%'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A'
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 15
    },
    dateText: {
        backgroundColor: '#D1D5DB',
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12
    },
    messageContainer: {
        marginBottom: 8,
        maxWidth: '75%'
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end'
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start'
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        marginBottom: 4
    },
    myMessage: {
        backgroundColor: '#C7B3E5',
        borderTopRightRadius: 4
    },
    theirMessage: {
        backgroundColor: '#F0F0F0',
        borderTopLeftRadius: 4
    },
    myMessageText: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 20
    },
    theirMessageText: {
        color: '#1A1A1A',
        fontSize: 15,
        lineHeight: 20
    },
    timestamp: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 8
    },
    myTimestamp: {
        textAlign: 'right'
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 12,
        alignItems: 'flex-end',
        backgroundColor: 'white'
    },
    addButton: {
        marginRight: 10,
        marginBottom: 2
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 30,
        paddingHorizontal: 15,
        paddingVertical: 12,
        maxHeight: 100
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        paddingVertical: 6,
        maxHeight: 80
    },
    emojiButton: {
        marginLeft: 8,
        padding: 4
    },
    sendButton: { padding: 10 },
    sendButtonText: { color: '#007AFF', fontWeight: 'bold' },
});
