import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

const BUILDERS = [
    { id: '1', name: 'Nomad Customs', specialty: 'Full Builds', rating: 4.9 },
    { id: '2', name: 'Solar Solutions', specialty: 'Electrical', rating: 4.8 },
    { id: '3', name: 'Van Cabinetry', specialty: 'Woodwork', rating: 4.7 },
];

export default function BuilderDirectoryScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>Verified Builders</Text>
            <FlatList
                data={BUILDERS}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.info}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.specialty}>{item.specialty}</Text>
                            <Text style={styles.rating}>⭐ {item.rating}</Text>
                        </View>
                        <TouchableOpacity style={styles.btn}>
                            <Text style={styles.btnText}>Contact</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold' },
    specialty: { color: 'gray' },
    rating: { marginTop: 5 },
    btn: { backgroundColor: '#FF6347', padding: 10, borderRadius: 5 },
    btnText: { color: 'white', fontWeight: 'bold' },
});
