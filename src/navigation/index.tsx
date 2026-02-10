import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

// ✅ ONLY ICON CHANGE: use Ionicons for tab icons
import Ionicons from '@expo/vector-icons/Ionicons';

// Screens
import LandingScreen from '../screens/auth/LandingScreen';
import InviteCodeScreen from '../screens/auth/InviteCodeScreen';
import AuthScreen from '../screens/auth/AuthScreen';
import MyProfileScreen from '../screens/profile/MyProfileScreen';
import SocialFeedScreen from '../screens/social/SocialFeedScreen';
import DatingDiscoverScreen from '../screens/dating/DatingDiscoverScreen';
import ConversationListScreen from '../screens/chat/ConversationListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import BuildersStack from '../screens/builders/BuildersStack';
import { NotFound } from './screens/NotFound';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

const HomeTabs = createBottomTabNavigator({
  screens: {
    Social: {
      screen: SocialFeedScreen,
      options: {
        title: 'Social',
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
        ),
      },
    },
    Dating: {
      screen: DatingDiscoverScreen,
      options: {
        title: 'Dating',
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
        ),
      },
    },
    Chat: {
      screen: ConversationListScreen,
      options: {
        title: 'Chat',
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
        ),
      },
    },
    MyProfile: {
      screen: MyProfileScreen,
      options: {
        title: 'Profile',
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
        ),
      },
    },
  },
  screenOptions: {
    headerShown: false,
    tabBarActiveTintColor: '#5B7FFF', // Violet/Blue from reference/chat
    tabBarInactiveTintColor: '#8E8E93',
    tabBarStyle: {
      backgroundColor: 'white',
      borderTopWidth: 0,
      elevation: 0, // Remove shadow on Android
      shadowOpacity: 0, // Remove shadow on iOS
      height: 80,
      paddingTop: 5,
      paddingBottom: 25,
      // Make it look like the image (clean, white)
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 0,
      marginTop: 5,
    },
    tabBarIconStyle: {
      marginTop: 5,
    },
    // Remove the custom background/button to simplify to match the clean vector image
    // tabBarButton: HapticTab,
    // tabBarBackground: TabBarBackground,
  },
});

import OnboardingStack from '../screens/onboarding/OnboardingStack';

// ... imports

const RootStack = createNativeStackNavigator({
  screens: {
    Landing: {
      screen: LandingScreen,
      options: { headerShown: false },
    },
    InviteCode: {
      screen: InviteCodeScreen,
      options: { title: 'Have an invite?' },
    },
    Auth: {
      screen: AuthScreen,
      options: { title: 'Login' },
    },
    Onboarding: {
      screen: OnboardingStack,
      options: { headerShown: false },
    },
    HomeTabs: {
      screen: HomeTabs,
      options: { headerShown: false },
    },
    NotFound: {
      screen: NotFound,
      options: { title: '404' },
      linking: { path: '*' },
    },
    ChatDetail: {
      screen: ChatScreen,
      options: { headerShown: false },
    },
    RoutePreviewScreen: {
      screen: require('../screens/profile/RoutePreviewScreen').default,
      options: { headerShown: false },
    },
    EditRouteScreen: {
      screen: require('../screens/profile/EditRouteScreen').default,
      options: { headerShown: false },
    },
  },
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
