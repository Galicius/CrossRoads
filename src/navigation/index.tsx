import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation, StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

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
    MyProfile: {
      screen: MyProfileScreen,
      options: {
        title: 'Profile',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
      },
    },
    Social: {
      screen: SocialFeedScreen,
      options: {
        title: 'Social',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
      },
    },
    Dating: {
      screen: DatingDiscoverScreen,
      options: {
        title: 'Dating',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
      },
    },
    Builders: {
      screen: BuildersStack,
      options: {
        title: 'Builders',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="hammer.fill" color={color} />,
      },
    },
    Chat: {
      screen: ConversationListScreen,
      options: {
        title: 'Chat',
        headerShown: false,
        tabBarIcon: ({ color }) => <IconSymbol size={28} name="bubble.left.fill" color={color} />,
      },
    },
  },
  screenOptions: {
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
    tabBarStyle: Platform.select({
      ios: {
        position: 'absolute' as const,
      },
      default: {},
    }),
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
      options: { title: 'Chat' },
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
