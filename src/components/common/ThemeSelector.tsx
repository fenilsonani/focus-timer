import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Card } from './Card';
import { ThemeMetadata, BorderRadiusMetadata } from '../../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2; // 2 columns with spacing

type ColorTheme = keyof typeof ThemeMetadata;
type BorderRadiusStyle = keyof typeof BorderRadiusMetadata;

interface ThemeSelectorProps {
  onClose?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { theme, colorTheme, mode, isDark, borderRadiusStyle, setMode, setColorTheme, setBorderRadiusStyle } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'themes' | 'style'>('themes');

  const handleThemeModePress = async (newMode: 'light' | 'dark' | 'auto') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setMode(newMode);
  };

  const handleColorThemePress = async (newColorTheme: ColorTheme) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setColorTheme(newColorTheme);
  };

  const handleBorderRadiusPress = async (newBorderRadius: BorderRadiusStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setBorderRadiusStyle(newBorderRadius);
  };

  const ThemeModeCard: React.FC<{
    mode: 'light' | 'dark' | 'auto';
    title: string;
    subtitle: string;
    icon: string;
  }> = ({ mode: modeValue, title, subtitle, icon }) => {
    const isSelected = mode === modeValue;
    
    return (
      <TouchableOpacity
        onPress={() => handleThemeModePress(modeValue)}
        style={[
          styles.modeCard,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.borderRadius.md,
          }
        ]}
        activeOpacity={0.7}
      >
        <MaterialIcons 
          name={icon as any} 
          size={28} 
          color={isSelected ? '#FFFFFF' : theme.colors.onSurface} 
        />
        <Text style={[
          styles.modeTitle,
          { color: isSelected ? '#FFFFFF' : theme.colors.onSurface }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.modeSubtitle,
          { color: isSelected ? '#FFFFFF' : theme.colors.onSurfaceVariant }
        ]}>
          {subtitle}
        </Text>
      </TouchableOpacity>
    );
  };

  const ColorThemeCard: React.FC<{
    themeKey: ColorTheme;
    metadata: typeof ThemeMetadata[ColorTheme];
  }> = ({ themeKey, metadata }) => {
    const isSelected = colorTheme === themeKey;
    
    return (
      <TouchableOpacity
        onPress={() => handleColorThemePress(themeKey)}
        style={[
          styles.colorThemeCard,
          {
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
            borderRadius: theme.borderRadius.lg,
          }
        ]}
        activeOpacity={0.8}
      >
        {/* Gradient Preview */}
        <LinearGradient
          colors={[metadata.gradient[0], metadata.gradient[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientPreview, { borderRadius: theme.borderRadius.md }]}
        >
          <MaterialIcons name={metadata.icon as any} size={32} color="#FFFFFF" />
        </LinearGradient>
        
        {/* Theme Info */}
        <View style={styles.themeInfo}>
          <Text style={[styles.themeName, { color: theme.colors.onSurface }]}>
            {metadata.name}
          </Text>
          <Text style={[styles.themeMood, { color: theme.colors.onSurfaceVariant }]}>
            {metadata.mood}
          </Text>
          <Text style={[styles.themeDescription, { color: theme.colors.onSurfaceVariant }]}>
            {metadata.description}
          </Text>
        </View>

        {/* Selected Indicator */}
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const BorderRadiusCard: React.FC<{
    radiusKey: BorderRadiusStyle;
    metadata: typeof BorderRadiusMetadata[BorderRadiusStyle];
  }> = ({ radiusKey, metadata }) => {
    const isSelected = borderRadiusStyle === radiusKey;
    
    return (
      <TouchableOpacity
        onPress={() => handleBorderRadiusPress(radiusKey)}
        style={[
          styles.radiusCard,
          {
            backgroundColor: isSelected ? theme.colors.primary + '15' : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.borderRadius.md,
          }
        ]}
        activeOpacity={0.7}
      >
        {/* Preview Shape */}
        <View
          style={[
            styles.radiusPreview,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: metadata.preview,
            }
          ]}
        />
        
        <Text style={[
          styles.radiusName,
          { color: isSelected ? theme.colors.primary : theme.colors.onSurface }
        ]}>
          {metadata.name}
        </Text>
        <Text style={[
          styles.radiusDescription,
          { color: theme.colors.onSurfaceVariant }
        ]}>
          {metadata.description}
        </Text>

        {isSelected && (
          <View style={[styles.selectedDot, { backgroundColor: theme.colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const TabButton: React.FC<{
    tab: 'themes' | 'style';
    title: string;
    icon: string;
  }> = ({ tab, title, icon }) => {
    const isSelected = selectedTab === tab;
    
    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedTab(tab);
        }}
        style={[
          styles.tabButton,
          {
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            borderRadius: theme.borderRadius.md,
          }
        ]}
        activeOpacity={0.7}
      >
        <MaterialIcons 
          name={icon as any} 
          size={20} 
          color={isSelected ? '#FFFFFF' : theme.colors.onSurfaceVariant} 
        />
        <Text style={[
          styles.tabTitle,
          { color: isSelected ? '#FFFFFF' : theme.colors.onSurfaceVariant }
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Customize Appearance
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Choose colors and style that match your mood
          </Text>
        </View>
        
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
        <TabButton tab="themes" title="Themes" icon="color-lens" />
        <TabButton tab="style" title="Style" icon="tune" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'themes' ? (
          <>
            {/* Light/Dark Mode Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Brightness
              </Text>
              <View style={styles.modeGrid}>
                <ThemeModeCard
                  mode="light"
                  title="Light"
                  subtitle="Bright & clean"
                  icon="light-mode"
                />
                <ThemeModeCard
                  mode="dark"
                  title="Dark"
                  subtitle="Easy on eyes"
                  icon="dark-mode"
                />
                <ThemeModeCard
                  mode="auto"
                  title="Auto"
                  subtitle="Follows system"
                  icon="brightness-auto"
                />
              </View>
            </View>

            {/* Color Themes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Mood & Colors
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
                Select a theme that matches your current mood or activity
              </Text>
              
              <View style={styles.colorThemeGrid}>
                {(Object.entries(ThemeMetadata) as [ColorTheme, typeof ThemeMetadata[ColorTheme]][]).map(([key, metadata]) => (
                  <ColorThemeCard key={key} themeKey={key} metadata={metadata} />
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Border Radius */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Corner Style
              </Text>
              <Text style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
                Adjust the roundness of buttons and cards
              </Text>
              
              <View style={styles.radiusGrid}>
                {(Object.entries(BorderRadiusMetadata) as [BorderRadiusStyle, typeof BorderRadiusMetadata[BorderRadiusStyle]][]).map(([key, metadata]) => (
                  <BorderRadiusCard key={key} radiusKey={key} metadata={metadata} />
                ))}
              </View>
            </View>

            {/* Preview Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Preview
              </Text>
                             <Card variant="outlined" style={styles.previewCard}>
                <Text style={[styles.previewTitle, { color: theme.colors.onSurface }]}>
                  Sample Card
                </Text>
                <Text style={[styles.previewText, { color: theme.colors.onSurfaceVariant }]}>
                  This is how your interface will look with the current settings.
                </Text>
                <View style={styles.previewButtons}>
                  <TouchableOpacity
                    style={[
                      styles.previewButton,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.borderRadius.md,
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.previewButtonText}>Primary Button</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.previewButtonOutline,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.borderRadius.md,
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.previewButtonOutlineText, { color: theme.colors.onSurface }]}>
                      Secondary
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 12,
  },
  colorThemeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorThemeCard: {
    width: cardWidth,
    backgroundColor: 'transparent',
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientPreview: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeInfo: {
    padding: 12,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeMood: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radiusCard: {
    width: cardWidth,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    position: 'relative',
  },
  radiusPreview: {
    width: 40,
    height: 40,
    marginBottom: 12,
  },
  radiusName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  radiusDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewCard: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  previewButtonOutline: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  previewButtonOutlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 