import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';

export default function LandingScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/image.svg')}
        style={styles.centeredImage}
        contentFit="contain"
      />

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
  container: { flex: 1, backgroundColor: 'white' },
  centeredImage: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    top: '25%', // Center vertically approx
    opacity: 0.8,
  },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 30 },
  header: { marginTop: 80 },
  appName: { fontSize: 48, fontWeight: 'bold', color: '#4d73ba', letterSpacing: 1 },
  tagline: { fontSize: 18, color: '#666', marginTop: 10, lineHeight: 26 },
  actions: { marginBottom: 50, gap: 15 },
  btn: { paddingVertical: 18, borderRadius: 30, alignItems: 'center' },
  primaryBtn: { backgroundColor: '#4d73ba', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { borderWidth: 1, borderColor: '#4d73ba', backgroundColor: 'transparent' },
  secondaryBtnText: { color: '#4d73ba', fontWeight: 'bold', fontSize: 16 },
});
