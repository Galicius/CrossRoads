import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '../ui/IconSymbol';

const { width, height } = Dimensions.get('window');

// Reduce card width slightly for a stacked look, or full width?
// User said "Full screen height cards". 
// Check implementation_plan: "Full screen height cards."
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height - 165; // Adjusted so buttons are halfway over image

interface Profile {
    id: string;
    name: string;
    age: number;
    bio: string;
    images: string[];
    distance?: string;
    route_data?: any[];
}

interface ReanimatedSwipeCardProps {
    profile: Profile;
    onPress?: () => void;
}

export const ReanimatedSwipeCard = ({ profile, onPress }: ReanimatedSwipeCardProps) => {
    // Default to first image
    const imageUri = profile.images && profile.images.length > 0
        ? profile.images[0]
        : 'https://via.placeholder.com/400x800';

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.card}>
            <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={200}
            />

            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            >
                <View style={styles.infoContainer}>
                    <View style={styles.row}>
                        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                        <IconSymbol name="checkmark.seal.fill" size={20} color="#1DA1F2" style={styles.verifiedIcon} />
                    </View>
                    <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
                    {profile.distance && (
                        <View style={styles.locationRow}>
                            <IconSymbol name="location.fill" size={14} color="#ffffffff" />
                            <Text style={styles.locationText}>{profile.distance}</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        justifyContent: 'flex-end',
        padding: 20,
    },
    infoContainer: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    verifiedIcon: {
        marginLeft: 8,
    },
    bio: {
        fontSize: 16,
        color: '#eee',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        color: '#fff',
        marginLeft: 4,
        fontSize: 14,
    },
});
