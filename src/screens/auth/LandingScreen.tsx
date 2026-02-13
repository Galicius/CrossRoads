import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function LandingScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f0f4f8', '#e6eef9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.appName}>CrossRoads</Text>
          <Text style={styles.tagline}>Connect with fellow nomads on the road.</Text>
        </View>

        <View style={styles.actions}>
          {/* Path 1: Verified Nomad via Invite Code */}
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => navigation.navigate('InviteCode')}
          >
            <Ionicons name="qr-code-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>I have an Invite Code</Text>
          </TouchableOpacity>

          {/* Path 2: Landlover */}
          <TouchableOpacity
            style={[styles.btn, styles.landloverBtn]}
            onPress={() => navigation.navigate('Auth', { userType: 'landlover' })}
          >
            <Ionicons name="home-outline" size={20} color="#4d73ba" style={{ marginRight: 8 }} />
            <Text style={styles.landloverBtnText}>Join as Landlover</Text>
          </TouchableOpacity>

          {/* Path 3: Login */}
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
  container: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 30 },
  header: { marginTop: 120 },
  appName: { fontSize: 48, fontWeight: 'bold', color: '#1A1A1A', letterSpacing: 1 },
  tagline: { fontSize: 18, color: '#4A5568', marginTop: 10, lineHeight: 26 },
  actions: { marginBottom: 60, gap: 12 },
  btn: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#4d73ba',
    shadowColor: '#4d73ba',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  landloverBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  landloverBtnText: { color: '#4d73ba', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#4d73ba',
    backgroundColor: 'transparent',
  },
  secondaryBtnText: { color: '#4d73ba', fontWeight: 'bold', fontSize: 16 },
});
