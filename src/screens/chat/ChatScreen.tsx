import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

type ChatScreenRouteProp = RouteProp<{
    ChatDetail: {
        chatId: string;
        otherUserName: string;
        otherUserAvatar?: string | null;
        isGroup?: boolean;
    }
}, 'ChatDetail'>;

export default function ChatScreen() {
    const route = useRoute<ChatScreenRouteProp>();
    const navigation = useNavigation();
    const { chatId, otherUserName, otherUserAvatar, isGroup } = route.params || {};

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
                .order('created_at', { ascending: false });

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
                    setMessages((prev) => {
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [payload.new, ...prev];
                    });
                }
            )
            .subscribe();
    };

    const sendMessage = async () => {
        if (!text.trim() || !currentUser) return;

        const content = text.trim();
        setText('');

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
                    content: content
                })
                .select()
                .single();

            if (error) throw error;
            // Replace optimistic message with real one, but only if realtime hasn't already added it
            setMessages(prev => {
                const hasReal = prev.some(m => m.id === data.id);
                if (hasReal) {
                    // Realtime already added it — just remove the optimistic
                    return prev.filter(m => m.id !== optimisticMessage.id);
                }
                // Replace optimistic with real
                return prev.map(m => m.id === optimisticMessage.id ? data : m);
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color="#4d73ba" /></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Image
                source={require('@/assets/images/image.jpg')}
                style={styles.backgroundImage}
                contentFit="cover"
                contentPosition="center"
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <View style={styles.headerAvatar}>
                            {isGroup ? (
                                <Image
                                    source={require('@/assets/images/activity.jpg')}
                                    style={styles.headerAvatarImage}
                                />
                            ) : (
                                otherUserAvatar ? (
                                    <Image
                                        source={{ uri: otherUserAvatar }}
                                        style={styles.headerAvatarImage}
                                    />
                                ) : (
                                    <View style={[styles.headerAvatarImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E5EA' }]}>
                                        <Ionicons name="person" size={20} color="#8E8E93" />
                                    </View>
                                )
                            )}
                        </View>
                        <Text style={styles.headerTitle}>{otherUserName || 'Chat'}</Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                {/* White Container for Messages and Input */}
                <View style={styles.whiteContainer}>
                    {/* Messages Area */}
                    <View style={styles.messagesArea}>
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
                            <IconSymbol name="plus.circle.fill" size={36} color="#4d73ba" />
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
                        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={!text.trim()}>
                            <IconSymbol name="paperplane.fill" size={24} color={text.trim() ? "#4d73ba" : "#8E8E93"} />
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
    },
    backgroundImage: {
        position: 'absolute',
        top: -85,
        left: 0,
        right: 0,
        bottom: 130,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: 'transparent'
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
        marginLeft: 10
    },
    backButton: {
        padding: 5
    },
    whiteContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden'
    },
    messagesArea: {
        flex: 1,
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
        backgroundColor: '#4d73ba',
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
        backgroundColor: 'white' // Ensure this matches whiteContainer
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
