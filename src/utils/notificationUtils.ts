/**
 * Browser Notification & Reminder utilities
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
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

export function sendNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    } catch (e) {
      console.error('Failed to trigger notification:', e);
    }
  }
}

/**
 * Check daily reminder conditions (09:10 AM clock-in, 09:00 PM clock-out)
 */
export function checkDailyReminders(
  hasClockedInToday: boolean,
  hasClockedOutToday: boolean,
  clockInTime: string = "09:10",
  clockOutTime: string = "21:00"
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Check 09:10 AM Clock-In reminder
  if (currentHHMM === clockInTime && !hasClockedInToday) {
    const lastNotified = localStorage.getItem('last_clock_in_reminder');
    const todayStr = now.toISOString().slice(0, 10);
    if (lastNotified !== todayStr) {
      sendNotification("Don't forget to Clock In!", {
        body: "It's past 9:10 AM. Clock in now to track today's working hours.",
        tag: 'clock-in-reminder'
      });
      localStorage.setItem('last_clock_in_reminder', todayStr);
    }
  }

  // Check 09:00 PM Clock-Out reminder
  if (currentHHMM === clockOutTime && hasClockedInToday && !hasClockedOutToday) {
    const lastNotified = localStorage.getItem('last_clock_out_reminder');
    const todayStr = now.toISOString().slice(0, 10);
    if (lastNotified !== todayStr) {
      sendNotification("Forgot to Clock Out?", {
        body: "It's past 9:00 PM. Remember to clock out to finalize your shift.",
        tag: 'clock-out-reminder'
      });
      localStorage.setItem('last_clock_out_reminder', todayStr);
    }
  }
}
