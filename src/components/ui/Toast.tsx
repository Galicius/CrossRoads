import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withSequence,
    runOnJS
} from 'react-native-reanimated';
import { IconSymbol } from './IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onHide?: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'success',
    onHide,
    duration = 2000
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);
    const [shouldRender, setShouldRender] = React.useState(visible);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            translateY.value = withSpring(insets.top + 10);
            opacity.value = withSpring(1);

            const hideTimeout = setTimeout(() => {
                translateY.value = withSpring(-100, {}, () => {
                    runOnJS(setShouldRender)(false);
                    if (onHide) runOnJS(onHide)();
                });
                opacity.value = withSpring(0);
            }, duration);

            return () => clearTimeout(hideTimeout);
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: opacity.value,
        };
    });

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'info': return '#4d73ba';
            default: return '#333';
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'success': return 'checkmark.circle.fill';
            case 'error': return 'exclamationmark.circle.fill';
            case 'info': return 'info.circle.fill';
            default: return 'info.circle.fill';
        }
    };

    if (!shouldRender) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={[styles.toast, { borderLeftColor: getBackgroundColor() }]}>
                <IconSymbol name={getIconName() as any} size={24} color={getBackgroundColor()} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        width: width - 40,
        borderLeftWidth: 4,
    },
    message: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
});
