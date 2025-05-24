import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Platform, SafeAreaView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AppStateProvider } from './src/hooks/useAppState';
import { ThemeProvider } from './src/hooks/useTheme';
import { HomeScreen } from './src/screens/HomeScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomNavigation } from './src/components/common/BottomNavigation';
import { notificationService } from './src/services/notificationService';
import { useTheme } from './src/hooks/useTheme';
import { AndroidStatusBarSpacer } from './src/components/common/AndroidStatusBarSpacer';

// Main app content component that has access to theme
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'notes' | 'reminders' | 'settings'>('home');

  // Initialize notification service
  useEffect(() => {
    notificationService.initialize();
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'notes':
        return <NotesScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={Platform.OS === 'android' ? theme.colors.background : undefined}
        translucent={Platform.OS === 'android'}
      />
      <AndroidStatusBarSpacer />
      {renderScreen()}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <AppContent />
          </BottomSheetModalProvider>
        </ThemeProvider>
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
