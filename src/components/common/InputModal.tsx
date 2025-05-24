import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface InputModalProps {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  placeholder: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  validation?: (value: string) => string | null; // Returns error message or null
}

export const InputModal: React.FC<InputModalProps> = ({
  isVisible,
  title,
  subtitle,
  placeholder,
  initialValue = '',
  confirmText = 'Create',
  cancelText = 'Cancel',
  icon = 'edit',
  onConfirm,
  onCancel,
  validation,
}) => {
  const { theme } = useTheme();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isVisible) {
      setValue(initialValue);
      setError(null);
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isVisible, initialValue]);

  const handleConfirm = () => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      setError('This field is required');
      return;
    }

    if (validation) {
      const validationError = validation(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onConfirm(trimmedValue);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setError(null);
    onCancel();
  };

  const handleChangeText = (text: string) => {
    setValue(text);
    if (error) {
      setError(null);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
            activeOpacity={1}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <MaterialIcons name={icon as any} size={24} color={theme.colors.primary} />
              </View>
              
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
              </Text>
              
              {subtitle && (
                <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: error ? theme.colors.error : theme.colors.border,
                    color: theme.colors.onSurface,
                  }
                ]}
                value={value}
                onChangeText={handleChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
                maxLength={50}
              />
              
              {error && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" size={16} color={theme.colors.error} />
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}
              
              <Text style={[styles.charCount, { color: theme.colors.onSurfaceVariant }]}>
                {value.length}/50
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title={cancelText}
                onPress={handleCancel}
                variant="ghost"
                style={styles.button}
              />
              <Button
                title={confirmText}
                onPress={handleConfirm}
                variant="primary"
                style={styles.button}
                disabled={!value.trim()}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
}); 