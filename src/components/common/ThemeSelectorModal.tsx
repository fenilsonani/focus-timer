import React from 'react';
import { Modal, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemeSelector } from './ThemeSelector';

interface ThemeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <ThemeSelector onClose={onClose} />
      </SafeAreaView>
    </Modal>
  );
}; 