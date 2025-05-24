import React from 'react';
import { View, Platform, StatusBar } from 'react-native';

export const AndroidStatusBarSpacer: React.FC = () => {
  // Only render on Android and when translucent status bar is used
  if (Platform.OS !== 'android') {
    return null;
  }

  const statusBarHeight = StatusBar.currentHeight || 0;

  return (
    <View 
      style={{ 
        height: statusBarHeight,
        backgroundColor: 'transparent' 
      }} 
    />
  );
}; 