import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LandingScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Background Image Placeholder */}
      <View style={styles.bgPlaceholder} />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.appName}>CrossRoads</Text>
          <Text style={styles.tagline}>Connect with fellow nomads on the road.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => navigation.navigate('InviteCode')}
          >
            <Text style={styles.primaryBtnText}>I have an Invite Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.secondaryBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#333' },
  bgPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#2a2a2a' }, // Replace with real image
  overlay: { flex: 1, backgroundColor: 'rgba(86, 89, 171, 0.4)', justifyContent: 'space-between', padding: 30 },
  header: { marginTop: 100 },
  appName: { fontSize: 48, fontWeight: 'bold', color: 'white', letterSpacing: 1 },
  tagline: { fontSize: 18, color: '#eee', marginTop: 10, lineHeight: 26 },
  actions: { marginBottom: 50, gap: 15 },
  btn: { paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
  primaryBtn: { backgroundColor: '#fff' },
  primaryBtnText: { color: '#5659ab', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { borderWidth: 1, borderColor: 'white', backgroundColor: 'transparent' },
  secondaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
