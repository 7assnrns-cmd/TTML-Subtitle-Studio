
/**
 * Utility for managing browser system notifications for background progress.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support system notifications.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

let activeNotification: Notification | null = null;

export function sendProgressNotification(
  progress: number, 
  status: string, 
  title: string = 'Karaoke Studio Extraction'
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body: `${status} (${Math.round(progress)}%)`,
    icon: '/favicon.ico',
    tag: 'extraction-progress', // Ensures we update the same notification
  };

  // On some browsers, we can't update a notification body easily without recreating it.
  // Using the 'tag' property helps group them.
  activeNotification = new Notification(title, options);
}

export function sendCompletionNotification(
  filename: string,
  title: string = 'Extraction Complete'
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body: `Finished processing: ${filename}. Your lyrics are ready!`,
    icon: '/favicon.ico',
    tag: 'extraction-progress',
  };

  activeNotification = new Notification(title, options);
  
  // Close after 5 seconds
  setTimeout(() => activeNotification?.close(), 5000);
}

export function sendErrorNotification(
  message: string,
  title: string = 'Extraction Failed'
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body: message,
    icon: '/favicon.ico',
    tag: 'extraction-progress',
  };

  activeNotification = new Notification(title, options);
}
