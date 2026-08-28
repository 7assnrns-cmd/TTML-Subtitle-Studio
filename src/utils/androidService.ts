import { Device, DeviceInfo } from '@capacitor/device';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface DeviceSpecs {
  manufacturer: string;
  model: string;
  operatingSystem: string;
  osVersion: string;
  platform: string;
  sdkVersion: number;
  screenWidth: number;
  screenHeight: number;
  memUsed: number;
}

/**
 * Service to handle Android-specific hardware detection and runtime permissions.
 */
export const AndroidService = {
  /**
   * Detects and logs device specifications.
   */
  async getDeviceSpecs(): Promise<DeviceSpecs> {
    const info = await Device.getInfo();
    const battery = await Device.getBatteryInfo();
    
    const specs: DeviceSpecs = {
      manufacturer: info.manufacturer,
      model: info.model,
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      platform: info.platform,
      sdkVersion: (info as any).androidSDKVersion || 0,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      memUsed: (info as any).memUsed || 0
    };

    console.log('[AndroidService] Device Specs Detected:', specs);
    return specs;
  },

  /**
   * Requests necessary runtime permissions for the app.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const info = await Device.getInfo();
      const platform = info.platform;

      if (platform !== 'android') return true;

      const sdkVersion = (info as any).androidSDKVersion || 0;

      // 1. Notifications Permission (Android 13+)
      if (sdkVersion >= 33) {
        const notifyPerm = await LocalNotifications.checkPermissions();
        if (notifyPerm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      }

      // 2. Storage/Filesystem Permissions
      const storagePerm = await Filesystem.checkPermissions();
      if (storagePerm.publicStorage !== 'granted') {
        await Filesystem.requestPermissions();
      }

      console.log('[AndroidService] Runtime permissions processed.');
      return true;
    } catch (error) {
      console.error('[AndroidService] Permission request failed:', error);
      return false;
    }
  }
};
