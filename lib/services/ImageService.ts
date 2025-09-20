import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/**
 * Result of an image selection operation
 */
export interface ImageResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Service for handling image capture and selection
 */
export class ImageService {
  /**
   * Requests camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Requests media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Launches the camera to take a photo
   */
  static async takePhoto(): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to take photos for your daily progress.'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }

  /**
   * Launches the image picker to select from gallery
   */
  static async pickFromGallery(): Promise<ImageResult | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Media Library Permission Required',
          'Please grant media library permission to select photos from your gallery.'
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      };
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
      return null;
    }
  }

  /**
   * Shows an action sheet to choose between camera and gallery
   */
  static async showImagePicker(): Promise<ImageResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Photo',
        'Choose how you want to add your daily photo',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.takePhoto();
              resolve(result);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const result = await this.pickFromGallery();
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  /**
   * Validates if a URI is a valid image
   */
  static isValidImageUri(uri: string): boolean {
    if (!uri) return false;
    
    // Check if it's a valid URI format
    const uriPattern = /^(file:\/\/|content:\/\/|https?:\/\/)/;
    return uriPattern.test(uri);
  }

  /**
   * Gets a placeholder image URI for demo purposes
   */
  static getPlaceholderImageUri(): string {
    // Return a placeholder that can be used for demo/testing
    return 'https://via.placeholder.com/200x200/333333/ffffff?text=Photo';
  }
}