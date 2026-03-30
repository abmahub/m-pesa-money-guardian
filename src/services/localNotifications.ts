import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function checkNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.error('[Notifications] Permission check failed:', err);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const alreadyGranted = await checkNotificationPermission();
    if (alreadyGranted) return true;

    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (err) {
    console.error('[Notifications] Permission request failed:', err);
    return false;
  }
}

export async function sendInstantNotification(title: string, body: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2147483647),
          title,
          body,
          schedule: { at: new Date(Date.now() + 250) },
        },
      ],
    });
  } catch (err) {
    console.error('[Notifications] Failed to schedule notification:', err);
  }
}