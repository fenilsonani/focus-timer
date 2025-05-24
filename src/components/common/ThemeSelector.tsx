import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Card } from './Card';
import { ThemeMetadata } from '../../constants/theme';

type ColorTheme = keyof typeof ThemeMetadata;

interface ThemeSelectorProps {
  onClose?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { theme, colorTheme, mode, isDark, setMode, setColorTheme } = useTheme();

  const handleThemeModePress = async (newMode: 'light' | 'dark' | 'auto') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setMode(newMode);
  };

  const handleColorThemePress = async (newColorTheme: ColorTheme) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setColorTheme(newColorTheme);
  };

  const renderThemeModeOption = (
    modeOption: 'light' | 'dark' | 'auto',
    label: string,
    icon: string
  ) => {
    const isSelected = mode === modeOption;
    
    return (
      <TouchableOpacity
        key={modeOption}
        style={[
          styles.themeModeOption,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        onPress={() => handleThemeModePress(modeOption)}
        activeOpacity={0.8}
      >
        <MaterialIcons
          name={icon as any}
          size={24}
          color={isSelected ? '#FFFFFF' : theme.colors.onSurface}
        />
        <Text
          style={[
            styles.themeModeLabel,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.onSurface,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderColorThemeOption = (themeKey: ColorTheme) => {
    const themeData = ThemeMetadata[themeKey];
    const isSelected = colorTheme === themeKey;

    return (
      <TouchableOpacity
        key={themeKey}
        style={[
          styles.colorThemeOption,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleColorThemePress(themeKey)}
        activeOpacity={0.8}
      >
        {/* Theme preview circle */}
        <View
          style={[
            styles.themePreview,
            {
              backgroundColor: themeData.preview,
            },
          ]}
        >
          {isSelected && (
            <MaterialIcons
              name="check"
              size={20}
              color="#FFFFFF"
            />
          )}
        </View>

        {/* Theme info */}
        <View style={styles.themeInfo}>
          <Text
            style={[
              styles.themeName,
              {
                color: theme.colors.onSurface,
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
          >
            {themeData.name}
          </Text>
          <Text
            style={[
              styles.themeDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {themeData.description}
          </Text>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <MaterialIcons
              name="radio-button-checked"
              size={20}
              color={theme.colors.primary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Choose Theme
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons
              name="close"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Mode Section */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Brightness
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            Choose light, dark, or auto mode
          </Text>
          
          <View style={styles.themeModeContainer}>
            {renderThemeModeOption('light', 'Light', 'light-mode')}
            {renderThemeModeOption('dark', 'Dark', 'dark-mode')}
            {renderThemeModeOption('auto', 'Auto', 'brightness-auto')}
          </View>
        </Card>

        {/* Color Theme Section */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Color Theme
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            Pick a color scheme that inspires focus
          </Text>
          
          <View style={styles.colorThemeContainer}>
            {(Object.keys(ThemeMetadata) as ColorTheme[]).map(renderColorThemeOption)}
          </View>
        </Card>

        {/* Current Theme Preview */}
        <Card variant="outlined" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Current Theme
          </Text>
          <View style={styles.currentThemePreview}>
            <View style={styles.previewRow}>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.previewText, { color: '#FFFFFF' }]}>Primary</Text>
              </View>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.previewText, { color: '#FFFFFF' }]}>Secondary</Text>
              </View>
            </View>
            <View style={styles.previewRow}>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.previewText, { color: theme.colors.onSurface }]}>Surface</Text>
              </View>
              <View style={[styles.previewCard, { backgroundColor: theme.colors.accent }]}>
                <Text style={[styles.previewText, { color: '#FFFFFF' }]}>Accent</Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  
  // Theme Mode Styles
  themeModeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeModeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Color Theme Styles
  colorThemeContainer: {
    gap: 12,
  },
  colorThemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Current Theme Preview
  currentThemePreview: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 