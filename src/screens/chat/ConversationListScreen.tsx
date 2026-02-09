import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const CHATS = [
    { id: '1', name: 'Alex', lastMessage: 'See you at the meetup?', time: '2m ago' },
    { id: '2', name: 'Sarah', lastMessage: 'The new solar panels are great!', time: '1h ago' },
];

export default function ConversationListScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Messages</Text>
            <FlatList
                data={CHATS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.item}>
                        <View style={styles.avatar} />
                        <View style={styles.content}>
                            <View style={styles.row}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.time}>{item.time}</Text>
                            </View>
                            <Text style={styles.message} numberOfLines={1}>{item.lastMessage}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: 'white' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    item: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ddd', marginRight: 15 },
    content: { flex: 1, justifyContent: 'center' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    name: { fontWeight: 'bold', fontSize: 16 },
    time: { color: 'gray', fontSize: 12 },
    message: { color: 'gray' },
});
