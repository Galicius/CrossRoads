# Technical Documentation

## Tech Stack

The application is built using the following technologies:

*   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (Managed Workflow)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Navigation**: [React Navigation v7](https://reactnavigation.org/)
    *   `@react-navigation/native-stack` for stack navigation
    *   `@react-navigation/bottom-tabs` for tab navigation
*   **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
*   **State Management**: React Context API & Local State
*   **Payments (IAP)**: [RevenueCat](https://www.revenuecat.com/) (`react-native-purchases`)
*   **Maps**: `react-native-maps`
*   **UI & Animations**:
    *   `react-native-reanimated`
    *   `react-native-gesture-handler`
    *   `expo-linear-gradient`
    *   `expo-blur`

## Architecture

The project follows a standard React Native directory structure under the `src/` directory.

### Directory Structure

*   **`src/screens/`**: specific screens.
    *   `auth/`: Authentication screens (Landing, Login, SignUp).
    *   `social/`: Social feed and interaction screens.
    *   `dating/`: Dating profile discovery and details.
    *   `chat/`: Messaging and conversation lists.
    *   `profile/`: User profile management and settings.
    *   `builders/`: Builder directory and request screens.
    *   `paywall/`: Subscription and paywall screens.
*   **`src/components/`**: Reusable UI components.
*   **`src/navigation/`**: Navigation configuration.
    *   `index.tsx`: Defines `RootStack` and `HomeTabs` navigators.
*   **`src/context/`**: Global state providers.
    *   `RevenueCatContext.tsx`: Manages subscription state.
    *   `EventsContext.tsx`: Manages event-related state.
*   **`src/lib/`**: External service clients (e.g., `supabase.ts`).
*   **`src/hooks/`**: Custom React hooks.

### Navigation Flow

1.  **RootStack**: The main stack navigator.
    *   Handles authentication flow (`Landing`, `Auth`, `Onboarding`).
    *   Hosts the main app tabs (`HomeTabs`).
    *   Manages global modals like `Paywall` and `ProfileDetail`.
2.  **HomeTabs**: A Bottom Tab Navigator accessible after login.
    *   **Social**: Main feed.
    *   **Dating**: Dating cards and discovery.
    *   **Chat**: User conversations.
    *   **Profile**: User's personal profile.

## RevenueCat Implementation

The application uses RevenueCat to manage In-App Purchases and Subscriptions.

### Logic & Initialization

*   **Location**: `src/context/RevenueCatContext.tsx`
*   **Provider**: `RevenueCatProvider` wraps the entire application in `App.tsx`.
*   **Initialization**: The SDK is initialized in the provider's `useEffect` hook using `Purchases.configure()`. It selects the appropriate API key based on the platform (iOS/Android).

### Key Features

1.  **Entitlement Checking**:
    *   The app checks for the **`CrossRoads Pro`** entitlement.
    *   The `isPro` boolean in `RevenueCatContext` indicates whether the current user has an active subscription.
    *   `checkEntitlements(info)` is called whenever customer info updates to keep the state in sync.

2.  **Verification Sync**:
    *   When a user is confirmed as "Pro", the `syncVerification` function automatically updates their `is_verified` status in the Supabase `profiles` table.
    *   Logic handles distinct rules for `landlover` (who may get Pro features but aren't auto-verified) vs other user types.

3.  **Paywalls**:
    *   The app utilizes `RevenueCatUI` to present native paywalls.
    *   `presentPaywall()`: Shows the paywall for the current offering.
    *   `presentPaywallIfNeeded()`: Shows the paywall only if the user does not have the required entitlement.

### Usage

Components access subscription data via the `useRevenueCat` hook:

```typescript
const { isPro, presentPaywall } = useRevenueCat();

// Example: Check access
if (!isPro) {
  presentPaywall();
  return;
}
```
