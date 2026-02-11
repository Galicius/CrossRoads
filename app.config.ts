import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'CrossRoads',
    slug: 'CrossRoads',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './src/assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    scheme: 'crossroads',
    ios: {
        supportsTablet: true,
    },
    android: {
        adaptiveIcon: {
            foregroundImage: './src/assets/images/adaptive-icon.png',
            backgroundColor: '#ffffff',
        },
        package: 'com.galicius.crossroads',
        config: {
            googleMaps: {
                apiKey: process.env.GOOGLE_MAPS_API_KEY,
            },
        },
    },
    web: {
        favicon: './src/assets/images/favicon.png',
    },
    plugins: [
        'expo-asset',
        [
            'expo-splash-screen',
            {
                backgroundColor: '#ffffff',
                image: './src/assets/images/splash-icon.png',
            },
        ],
        '@react-native-community/datetimepicker',
    ],
    extra: {
        eas: {
            projectId: '0ddd9756-27e6-4308-9a83-7c735c5e317f',
        },
    },
});
