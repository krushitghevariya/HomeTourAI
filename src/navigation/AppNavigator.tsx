import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Auth
import { SplashScreen }  from '../screens/auth/SplashScreen';
import { SignUpScreen }  from '../screens/auth/SignUpScreen';
import { LoginScreen }   from '../screens/auth/LoginScreen';

// Core
import { DashboardScreen }       from '../screens/core/DashboardScreen';
import { NewProjectSetupScreen } from '../screens/core/NewProjectSetupScreen';
import { ProcessingScreen }      from '../screens/core/ProcessingScreen';
import { ProjectDetailScreen }   from '../screens/core/ProjectDetailScreen';

// Upload
import { UploadPhotosScreen } from '../screens/upload/UploadPhotosScreen';
import { UploadVideoScreen }  from '../screens/upload/UploadVideoScreen';

// Export & Settings
import { ExportShareScreen } from '../screens/export/ExportShareScreen';
import { SettingsScreen }    from '../screens/settings/SettingsScreen';

/**
 * AppNavigator wires screen components to their routes.
 * No backend logic lives here — screens receive handler props
 * from container components or a state management layer (Redux / Zustand / React Query).
 *
 * Auth gating (auth vs. app stack) should be split into sub-navigators
 * once the auth layer is implemented.
 */

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Auth */}
    <Stack.Screen name="Splash"           component={SplashScreen as any} />
    <Stack.Screen name="SignUp"           component={SignUpScreen as any} />
    <Stack.Screen name="Login"            component={LoginScreen  as any} />

    {/* Core */}
    <Stack.Screen name="Dashboard"        component={DashboardScreen       as any} />
    <Stack.Screen name="NewProjectSetup"  component={NewProjectSetupScreen as any} />
    <Stack.Screen name="Processing"       component={ProcessingScreen      as any} />
    <Stack.Screen name="ProjectDetail"    component={ProjectDetailScreen   as any} />

    {/* Upload */}
    <Stack.Screen name="UploadPhotos"     component={UploadPhotosScreen as any} />
    <Stack.Screen name="UploadVideo"      component={UploadVideoScreen  as any} />

    {/* Export & Settings */}
    <Stack.Screen name="ExportShare"      component={ExportShareScreen as any} />
    <Stack.Screen name="Settings"         component={SettingsScreen    as any} />
  </Stack.Navigator>
);
