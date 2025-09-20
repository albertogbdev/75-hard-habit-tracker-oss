import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageService } from '../lib/services';
import { theme } from '../styles';

interface PhotoPickerProps {
  photoUri?: string;
  onPhotoSelect: (uri: string) => void;
  onPhotoDelete?: () => void;
  disabled?: boolean;
}

/**
 * PhotoPicker component for capturing and displaying progress photos
 */
export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photoUri,
  onPhotoSelect,
  onPhotoDelete,
  disabled = false,
}) => {
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);

  const handlePhotoPress = async () => {
    if (disabled) return;

    if (photoUri) {
      // If photo exists, show fullscreen view
      setIsFullscreenVisible(true);
    } else {
      // If no photo, show picker
      await selectNewPhoto();
    }
  };

  const selectNewPhoto = async () => {
    try {
      const result = await ImageService.showImagePicker();
      if (result) {
        onPhotoSelect(result.uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert(
        'Photo Error',
        'Failed to select photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setIsFullscreenVisible(false);
            if (onPhotoDelete) {
              onPhotoDelete();
            }
          }
        }
      ]
    );
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Photo',
      'Do you want to change your progress photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Change', 
          onPress: () => {
            setIsFullscreenVisible(false);
            selectNewPhoto();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Progress Photo</Text>
      
      <TouchableOpacity
        onPress={handlePhotoPress}
        disabled={disabled}
        style={[
          styles.photoContainer,
          disabled && styles.photoContainerDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={photoUri ? 'View progress photo' : 'Add progress photo'}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>
              Tap to add photo
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Fullscreen Photo Modal */}
      <Modal
        visible={isFullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullscreenVisible(false)}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenBackground}
            onPress={() => setIsFullscreenVisible(false)}
            activeOpacity={1}
          >
            <Image
              source={{ uri: photoUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.fullscreenControls}>
          {/* Change Photo Button */}
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
          >
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
          
          {/* Delete Photo Button */}
          <TouchableOpacity
            style={styles.deletePhotoButton}
            onPress={handleDeletePhoto}
          >
            <Text style={styles.deletePhotoText}>Delete Photo</Text>
          </TouchableOpacity>
          </View>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsFullscreenVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      
      <Text style={styles.hint}>
        Take a progress photo to track your transformation
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  photoContainer: {
    width: '100%',
    height: 240,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.base,
    overflow: 'hidden',
    ...theme.shadows.sm,
    position: 'relative',
  },
  photoContainerDisabled: {
    opacity: 0.6,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  placeholderIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  hint: {
    display: 'none', // Hide hint text to save space
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  changePhotoButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.lg,
  },
  changePhotoText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  deletePhotoButton: {
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.lg,
  },
  deletePhotoText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  fullscreenControls: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});