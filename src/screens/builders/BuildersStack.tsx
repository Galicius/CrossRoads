import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuilderDirectoryScreen from './BuilderDirectoryScreen';
import CreateRequestScreen from './CreateRequestScreen';
import RequestDetailsScreen from './RequestDetailsScreen';
import BuilderRegistrationScreen from './BuilderRegistrationScreen';
import BuilderProfileScreen from './BuilderProfileScreen';

export type BuildersStackParamList = {
    BuilderDirectory: undefined;
    CreateRequest: undefined;
    RequestDetails: { requestId: string };
    BuilderRegistration: undefined;
    BuilderProfile: { builderId: string };
};

const Stack = createNativeStackNavigator<BuildersStackParamList>();

export default function BuildersStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="BuilderDirectory"
                component={BuilderDirectoryScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateRequest"
                component={CreateRequestScreen}
                options={{ title: 'Ask for Help' }}
            />
            <Stack.Screen
                name="RequestDetails"
                component={RequestDetailsScreen}
                options={{ title: 'Request Details' }}
            />
            <Stack.Screen
                name="BuilderRegistration"
                component={BuilderRegistrationScreen}
                options={{ title: 'Become a Builder' }}
            />
            <Stack.Screen
                name="BuilderProfile"
                component={BuilderProfileScreen}
                options={{ title: 'Builder Profile' }}
            />
        </Stack.Navigator>
    );
}
