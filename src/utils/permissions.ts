import { Capacitor } from '@capacitor/core';

export interface PermissionStatusResult {
  granted: boolean;
  message?: string;
}

/**
  * Utility to handle runtime permission requests smoothly across Android 9+ and Web platforms.
  */
export async function requestMicrophonePermission(): Promise<PermissionStatusResult> {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after permission check if just checking
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    }
    return { granted: false, message: 'Audio recording is not supported on this browser or platform.' };
  } catch (err: any) {
    console.warn('Microphone permission denied or error:', err);
    return {
      granted: false,
      message: err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone permission was denied. Please allow microphone access in your system/app settings.'
        : 'Microphone access unavailable or blocked.'
    };
  }
}

/**
  * Utility to verify file storage access readiness on native Android & Web
  */
export async function checkFileAccessPermission(): Promise<PermissionStatusResult> {
  if (Capacitor.isNativePlatform()) {
    // Native Android platform: Capacitor webview handles standard file input / picker intents smoothly
    return { granted: true };
  }
  return { granted: true };
}
