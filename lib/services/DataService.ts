import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { Alert, Platform } from 'react-native';
import { ChallengeData, StorageService } from './StorageService';

/**
 * Export data structure for the 75 Hard app
 */
export interface ExportData {
  version: number;
  exportDate: string;
  appVersion: string;
  challengeData: ChallengeData;
}

/**
 * Service for handling data import/export operations
 */
export class DataService {
  private static readonly EXPORT_VERSION = 1;
  private static readonly APP_VERSION = '1.0.0';

  /**
   * Exports app data to a ZIP file containing JSON data and photos
   */
  static async exportDataAsZip(): Promise<{ success: boolean; message: string; filePath?: string }> {
    try {
      console.log('Starting ZIP export process...');
      const challengeData = await StorageService.loadChallengeData();
      
      if (!challengeData) {
        console.log('No challenge data found');
        return {
          success: false,
          message: 'No challenge data found to export',
        };
      }

      console.log('Challenge data loaded successfully');
      const exportData: ExportData = {
        version: this.EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        appVersion: this.APP_VERSION,
        challengeData,
      };

      // Create ZIP file
      const zip = new JSZip();
      
      // Add JSON data to ZIP
      zip.file('75-hard-backup.json', JSON.stringify(exportData, null, 2));
      console.log('JSON data added to ZIP');

      // Collect and add photos to ZIP
      let photoCount = 0;
      for (let dayIndex = 0; dayIndex < challengeData.days.length; dayIndex++) {
        const day = challengeData.days[dayIndex];
        
        // Check all attempts for this day
        for (const attempt of day.attempts) {
          if (attempt.photoUri && attempt.completed) {
            try {
              console.log(`Processing photo for day ${dayIndex + 1}:`, attempt.photoUri);
              
              // Read the photo file
              const photoFile = new File(attempt.photoUri);
              const photoExists = photoFile.exists;
              
              if (photoExists) {
                const photoData = await photoFile.arrayBuffer();
                const dayNumber = dayIndex + 1;
                const filename = `${dayNumber}.jpg`;
                
                zip.file(filename, photoData);
                photoCount++;
                console.log(`Added photo ${filename} to ZIP`);
              } else {
                console.log(`Photo not found for day ${dayIndex + 1}:`, attempt.photoUri);
              }
            } catch (photoError) {
              console.error(`Error processing photo for day ${dayIndex + 1}:`, photoError);
              // Continue with other photos even if one fails
            }
          }
        }
      }

      console.log(`Total photos added to ZIP: ${photoCount}`);

      // Generate ZIP file
      const zipData = await zip.generateAsync({ type: 'uint8array' });
      console.log('ZIP file generated, size:', zipData.length, 'bytes');

      // Generate filename with timestamp
      const now = new Date();
      const timeStamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
      const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
      const filename = `75-hard-backup-${timeStamp}-${milliseconds}.zip`;
      console.log('Generated ZIP filename:', filename);

      let file: File;
      let selectedDirectory: string | null = null;

      if (Platform.OS === 'android') {
        try {
          console.log('Android detected, using StorageAccessFramework...');
          // Use legacy StorageAccessFramework for proper external storage access
          const SystemIO = FileSystem.StorageAccessFramework;
          const documentUri = SystemIO.getUriForDirectoryInRoot('Documents');
          const permission = await SystemIO.requestDirectoryPermissionsAsync(documentUri);
          
          if (permission.granted) {
            console.log('Permission granted, directory URI:', permission.directoryUri);
            const createdPath = await SystemIO.createFileAsync(
              permission.directoryUri,
              filename,
              'application/zip'
            );
            console.log('ZIP file created at:', createdPath);
            
            // Convert Uint8Array to base64 for writing
            const base64Data = btoa(String.fromCharCode(...zipData));
            await SystemIO.writeAsStringAsync(createdPath, base64Data, { encoding: 'base64' });
            console.log('ZIP file written successfully');
            
            return {
              success: true,
              message: `Data exported successfully to ${filename}. ZIP contains JSON backup and ${photoCount} photos. File saved to selected location.`,
              filePath: createdPath,
            };
          } else {
            console.log('Permission denied, falling back to default location');
            // Fall back to default location
            file = new File(Paths.document, filename);
            console.log('Fallback file path:', file.uri);
          }
        } catch (error) {
          console.log('StorageAccessFramework error:', error);
          // If error occurs, fall back to default location
          console.log('Falling back to default Documents directory');
          file = new File(Paths.document, filename);
          console.log('Fallback file path:', file.uri);
        }
      } else {
        console.log('iOS detected, using default Documents directory');
        // On iOS, use default Documents directory
        file = new File(Paths.document, filename);
        console.log('iOS file path:', file.uri);
      }
      
      // Only execute this if we're using the fallback (file variable is set)
      if (file) {
        console.log('Attempting to write ZIP file...');
        console.log('File URI:', file.uri);
        console.log('ZIP data size:', zipData.length, 'bytes');
        
        // Write ZIP data to file
        await file.write(zipData);
        console.log('ZIP file written successfully');

        const locationMessage = 'File saved to Documents folder';

        console.log('ZIP export completed successfully');
        return {
          success: true,
          message: `Data exported successfully to ${filename}. ZIP contains JSON backup and ${photoCount} photos. ${locationMessage}.`,
          filePath: file.uri,
        };
      }
    } catch (error) {
      console.error('ZIP export error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      return {
        success: false,
        message: `ZIP export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Exports app data to a JSON file with user-selected save location
   */
  static async exportData(): Promise<{ success: boolean; message: string; filePath?: string }> {
    try {
      console.log('Starting export process...');
      const challengeData = await StorageService.loadChallengeData();
      
      if (!challengeData) {
        console.log('No challenge data found');
        return {
          success: false,
          message: 'No challenge data found to export',
        };
      }

      console.log('Challenge data loaded successfully');
      const exportData: ExportData = {
        version: this.EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        appVersion: this.APP_VERSION,
        challengeData,
      };

      // Generate filename with timestamp including milliseconds for uniqueness
      const now = new Date();
      const timeStamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
      const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
      const filename = `75-hard-backup-${timeStamp}-${milliseconds}.json`;
      console.log('Generated filename:', filename);

      let file: File;
      let selectedDirectory: string | null = null;

      if (Platform.OS === 'android') {
        try {
          console.log('Android detected, using StorageAccessFramework...');
          // Use legacy StorageAccessFramework for proper external storage access
          const SystemIO = FileSystem.StorageAccessFramework;
          const documentUri = SystemIO.getUriForDirectoryInRoot('Documents');
          const permission = await SystemIO.requestDirectoryPermissionsAsync(documentUri);
          
          if (permission.granted) {
            console.log('Permission granted, directory URI:', permission.directoryUri);
            const createdPath = await SystemIO.createFileAsync(
              permission.directoryUri,
              filename,
              'application/json'
            );
            console.log('File created at:', createdPath);
            
            await SystemIO.writeAsStringAsync(createdPath, JSON.stringify(exportData, null, 2));
            console.log('File written successfully');
            
            return {
              success: true,
              message: `Data exported successfully to ${filename}. File saved to selected location.`,
              filePath: createdPath,
            };
          } else {
            console.log('Permission denied, falling back to default location');
            // Fall back to default location
            file = new File(Paths.document, filename);
            console.log('Fallback file path:', file.uri);
          }
        } catch (error) {
          console.log('StorageAccessFramework error:', error);
          // If error occurs, fall back to default location
          console.log('Falling back to default Documents directory');
          file = new File(Paths.document, filename);
          console.log('Fallback file path:', file.uri);
        }
      } else {
        console.log('iOS detected, using default Documents directory');
        // On iOS, use default Documents directory (iOS doesn't support directory picker)
        file = new File(Paths.document, filename);
        console.log('iOS file path:', file.uri);
      }
      
      // Only execute this if we're using the fallback (file variable is set)
      if (file) {
        console.log('Attempting to write file...');
        console.log('File URI:', file.uri);
        console.log('Data size:', JSON.stringify(exportData, null, 2).length, 'characters');
        
        // Write data to file using new API
        await file.write(JSON.stringify(exportData, null, 2));
        console.log('File written successfully');

        const locationMessage = 'File saved to Documents folder';

        console.log('Export completed successfully');
        return {
          success: true,
          message: `Data exported successfully to ${filename}. ${locationMessage}.`,
          filePath: file.uri,
        };
      }
    } catch (error) {
      console.error('Export error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      return {
        success: false,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Imports app data from a JSON file
   */
  static async importData(fileUri: string): Promise<{ success: boolean; message: string }> {
    try {
      // Read file content using new File API
      const file = new File(fileUri);
      const fileContent = await file.text();

      // Parse JSON data
      let importData: ExportData;
      try {
        importData = JSON.parse(fileContent);
      } catch (parseError) {
        return {
          success: false,
          message: 'Invalid file format. Please select a valid 75 Hard backup file.',
        };
      }

      // Validate import data structure
      const validationResult = this.validateImportData(importData);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.message,
        };
      }

      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Import Data',
          `This will replace all current data with the backup from ${new Date(importData.exportDate).toLocaleDateString()}. This action cannot be undone.\n\nAre you sure you want to continue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({
                success: false,
                message: 'Import cancelled by user.',
              }),
            },
            {
              text: 'Import',
              style: 'destructive',
              onPress: async () => {
                try {
                  // Clear existing data
                  await StorageService.clearChallengeData();
                  
                  // Import new data
                  await StorageService.saveChallengeData(importData.challengeData);
                  
                  resolve({
                    success: true,
                    message: 'Data imported successfully! The app will refresh with your imported data.',
                  });
                } catch (importError) {
                  console.error('Import error:', importError);
                  resolve({
                    success: false,
                    message: `Import failed: ${importError instanceof Error ? importError.message : 'Unknown error'}`,
                  });
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validates the structure of import data
   */
  private static validateImportData(data: any): { isValid: boolean; message: string } {
    // Check if data exists
    if (!data) {
      return { isValid: false, message: 'File is empty or corrupted.' };
    }

    // Check required fields
    if (typeof data.version !== 'number') {
      return { isValid: false, message: 'Invalid file format: missing version.' };
    }

    if (!data.exportDate || typeof data.exportDate !== 'string') {
      return { isValid: false, message: 'Invalid file format: missing export date.' };
    }

    if (!data.challengeData) {
      return { isValid: false, message: 'Invalid file format: missing challenge data.' };
    }

    // Validate challenge data structure
    const challengeData = data.challengeData;
    if (typeof challengeData.version !== 'number' ||
        !challengeData.startDate ||
        !Array.isArray(challengeData.days) ||
        typeof challengeData.currentDayIndex !== 'number') {
      return { isValid: false, message: 'Invalid file format: corrupted challenge data.' };
    }

    // Check if days array has correct length
    if (challengeData.days.length !== 75) {
      return { isValid: false, message: 'Invalid file format: incorrect number of days.' };
    }

    return { isValid: true, message: 'Valid import data.' };
  }

  /**
   * Gets information about a backup ZIP file without importing it
   */
  static async getBackupInfoFromZip(fileUri: string): Promise<{
    success: boolean;
    info?: {
      exportDate: string;
      appVersion: string;
      challengeStartDate: string;
      currentDay: number;
      completedDays: number;
    };
    message: string;
  }> {
    try {
      console.log('Reading ZIP file for backup info:', fileUri);
      
      // Read ZIP file
      const file = new File(fileUri);
      const zipData = await file.arrayBuffer();
      
      // Load ZIP using JSZip
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipData);
      
      // Extract JSON file
      const jsonFile = loadedZip.file('75-hard-backup.json');
      if (!jsonFile) {
        return {
          success: false,
          message: 'Invalid backup file: JSON data not found in ZIP.',
        };
      }
      
      const jsonContent = await jsonFile.async('string');
      const importData: ExportData = JSON.parse(jsonContent);
      
      const validationResult = this.validateImportData(importData);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.message,
        };
      }

      const completedDays = importData.challengeData.days.filter(day => 
        day.attempts.some(attempt => attempt.completed)
      ).length;

      return {
        success: true,
        info: {
          exportDate: importData.exportDate,
          appVersion: importData.appVersion || 'Unknown',
          challengeStartDate: importData.challengeData.startDate,
          currentDay: importData.challengeData.currentDayIndex,
          completedDays,
        },
        message: 'Backup ZIP file is valid.',
      };
    } catch (error) {
      console.error('Error reading ZIP backup info:', error);
      return {
        success: false,
        message: `Failed to read backup ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Imports app data from a ZIP file containing JSON and photos
   */
  static async importDataFromZip(fileUri: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting ZIP import process:', fileUri);
      
      // Read ZIP file
      const file = new File(fileUri);
      const zipData = await file.arrayBuffer();
      
      // Load ZIP using JSZip
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipData);
      
      // Extract JSON file
      const jsonFile = loadedZip.file('75-hard-backup.json');
      if (!jsonFile) {
        return {
          success: false,
          message: 'Invalid backup file: JSON data not found in ZIP.',
        };
      }
      
      const jsonContent = await jsonFile.async('string');
      let importData: ExportData;
      
      try {
        importData = JSON.parse(jsonContent);
      } catch (parseError) {
        return {
          success: false,
          message: 'Invalid file format. Please select a valid 75 Hard backup ZIP file.',
        };
      }

      // Validate import data structure
      const validationResult = this.validateImportData(importData);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.message,
        };
      }

      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Import Data',
          `This will replace all current data with the backup from ${new Date(importData.exportDate).toLocaleDateString()}. Photos will also be restored. This action cannot be undone.\n\nAre you sure you want to continue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve({
                success: false,
                message: 'Import cancelled by user.',
              }),
            },
            {
              text: 'Import',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('User confirmed import, processing...');
                  
                  // Clear existing data
                  await StorageService.clearChallengeData();
                  console.log('Existing data cleared');
                  
                  // Extract and restore photos
                  let restoredPhotos = 0;
                  const photoMapping: { [key: string]: string } = {};
                  
                  // Process each photo in the ZIP
                  for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
                    if (filename.endsWith('.jpg') && !zipEntry.dir) {
                      try {
                        const dayMatch = filename.match(/^(\d+)\.jpg$/);
                        if (dayMatch) {
                          const dayNumber = parseInt(dayMatch[1]);
                          console.log(`Restoring photo for day ${dayNumber}`);
                          
                          // Get photo data as uint8array (binary data)
                           const photoData = await zipEntry.async('uint8array');
                           
                           // Create a new file in the app's cache directory
                           const photoFilename = `restored_day_${dayNumber}_${Date.now()}.jpg`;
                           const photoFile = new File(Paths.cache, photoFilename);
                           
                           // Write photo data to file (binary format)
                           await photoFile.write(photoData);
                          
                          // Store mapping for updating URIs
                          photoMapping[dayNumber.toString()] = photoFile.uri;
                          restoredPhotos++;
                          
                          console.log(`Photo restored for day ${dayNumber}: ${photoFile.uri}`);
                        }
                      } catch (photoError) {
                        console.error(`Error restoring photo ${filename}:`, photoError);
                        // Continue with other photos even if one fails
                      }
                    }
                  }
                  
                  console.log(`Total photos restored: ${restoredPhotos}`);
                  
                  // Update photo URIs in the challenge data
                  const updatedChallengeData = { ...importData.challengeData };
                  updatedChallengeData.days = updatedChallengeData.days.map((day, dayIndex) => {
                    const dayNumber = (dayIndex + 1).toString();
                    if (photoMapping[dayNumber]) {
                      // Update photo URI in all attempts for this day
                      const updatedDay = { ...day };
                      updatedDay.attempts = day.attempts.map(attempt => {
                        if (attempt.photoUri) {
                          return { ...attempt, photoUri: photoMapping[dayNumber] };
                        }
                        return attempt;
                      });
                      return updatedDay;
                    }
                    return day;
                  });
                  
                  // Import updated data
                  await StorageService.saveChallengeData(updatedChallengeData);
                  console.log('Challenge data imported successfully');
                  
                  resolve({
                    success: true,
                    message: `Data imported successfully! Restored ${restoredPhotos} photos. The app will refresh with your imported data.`,
                  });
                } catch (importError) {
                  console.error('Import error:', importError);
                  resolve({
                    success: false,
                    message: `Import failed: ${importError instanceof Error ? importError.message : 'Unknown error'}`,
                  });
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('ZIP import error:', error);
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Gets information about a backup file without importing it
   */
  static async getBackupInfo(fileUri: string): Promise<{
    success: boolean;
    info?: {
      exportDate: string;
      appVersion: string;
      challengeStartDate: string;
      currentDay: number;
      completedDays: number;
    };
    message: string;
  }> {
    try {
      const file = new File(fileUri);
      const fileContent = await file.text();

      const importData: ExportData = JSON.parse(fileContent);
      
      const validationResult = this.validateImportData(importData);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.message,
        };
      }

      const completedDays = importData.challengeData.days.filter(day => 
        day.attempts.some(attempt => attempt.completed)
      ).length;

      return {
        success: true,
        info: {
          exportDate: importData.exportDate,
          appVersion: importData.appVersion || 'Unknown',
          challengeStartDate: importData.challengeData.startDate,
          currentDay: importData.challengeData.currentDayIndex,
          completedDays,
        },
        message: 'Backup file is valid.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to read backup file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}