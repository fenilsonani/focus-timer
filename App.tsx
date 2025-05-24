import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

export default function App() {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <ThemeProvider>
          <BottomSheetModalProvider>
            <View style={styles.container}>
              {renderScreen()}
              <BottomNavigation
                activeTab={activeTab}
                onTabPress={setActiveTab}
              />
            </View>
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
