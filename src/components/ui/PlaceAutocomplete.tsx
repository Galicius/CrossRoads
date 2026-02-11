import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import debounce from 'lodash/debounce';

interface Place {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
    };
}

interface PlaceAutocompleteProps {
    onSelect: (place: { name: string; lat: number; lng: number }) => void;
    placeholder?: string;
}

export function PlaceAutocomplete({ onSelect, placeholder = "Search for a city..." }: PlaceAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const searchPlaces = async (text: string) => {
        if (!text || text.length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Using Open-Meteo Geocoding API as a more reliable free alternative to Nominatim
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=en&format=json`
            );

            const data = await response.json();

            if (data.results) {
                // Map OpenMeteo format to our internal Place interface
                const mappedResults: Place[] = data.results.map((item: any) => ({
                    place_id: item.id,
                    lat: item.latitude.toString(),
                    lon: item.longitude.toString(),
                    display_name: `${item.name}, ${item.admin1 ? item.admin1 + ', ' : ''}${item.country}`,
                    address: {
                        city: item.name,
                        country: item.country
                    }
                }));
                setResults(mappedResults);
                setShowResults(true);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Error searching places:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounce the search to avoid hitting the API too frequently
    const debouncedSearch = useCallback(debounce(searchPlaces, 800), []);

    const handleChange = (text: string) => {
        setQuery(text);
        debouncedSearch(text);
    };

    const handleSelect = (item: Place) => {
        const name = item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0];
        const country = item.address?.country || '';
        const displayName = country ? `${name}, ${country}` : name;

        onSelect({
            name: displayName,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        });
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <IconSymbol name="magnifyingglass" size={20} color="#999" />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    value={query}
                    onChangeText={handleChange}
                    placeholderTextColor="#999"
                />
                {loading && <ActivityIndicator size="small" color="#4d73ba" />}
            </View>

            {showResults && results.length > 0 && (
                <View style={styles.resultsContainer}>
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.place_id.toString()}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                                <IconSymbol name="mappin.circle.fill" size={20} color="#4d73ba" />
                                <View style={styles.resultTextContainer}>
                                    <Text style={styles.resultMainText}>
                                        {item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0]}
                                    </Text>
                                    <Text style={styles.resultSubText} numberOfLines={1}>
                                        {item.display_name}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 100,
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#eee'
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333'
    },
    resultsContainer: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden'
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    resultTextContainer: {
        marginLeft: 10,
        flex: 1,
    },
    resultMainText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333'
    },
    resultSubText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2
    }
});
