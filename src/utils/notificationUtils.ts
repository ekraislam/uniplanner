import type { Assessment, Language } from '../types';
import { getAssessmentUrgency } from './priorityUtils';
import { safeGetItem, safeSetItem, STORAGE_KEYS } from './storage';

const NOTIFIED_CACHE_KEY = 'uniplanner_notified_cache_v1';

interface NotifiedCache {
  [cacheKey: string]: string; // key -> date string (YYYY-MM-DD)
}

/**
 * Checks whether the current browser supports HTML5 Web Notifications and ServiceWorker.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current browser notification permission state ('default' | 'granted' | 'denied').
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Requests browser permission for notifications asynchronously.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (error) {
    console.warn('[UniPlanner Notifications] Permission request error:', error);
    return 'denied';
  }
}

/**
 * Sends a notification using ServiceWorker registration if ready, falling back to Notification constructor.
 */
async function dispatchNotification(
  title: string,
  options: NotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          ...options,
        });
        return true;
      }
    }

    // Direct Notification fallback
    new Notification(title, {
      icon: '/icons/icon-192.png',
      ...options,
    });
    return true;
  } catch (error) {
    console.warn('[UniPlanner Notifications] Dispatch error:', error);
    return false;
  }
}

/**
 * Sends an immediate verification test notification to test permissions & system sound.
 */
export async function sendTestNotification(lang: Language = 'en'): Promise<boolean> {
  const isBn = lang === 'bn';
  const title = isBn
    ? 'UniPlanner 🔔 টেস্ট নোটিফিকেশন'
    : 'UniPlanner 🔔 Test Notification';

  const body = isBn
    ? 'নোটিফিকেশন সফলভাবে চালু হয়েছে! পরীক্ষার ১ দিন আগে ও ডেডলাইনের দিন সকালে আপনি রিমাইন্ডার পাবেন।'
    : 'Notifications are working! You will receive automatic reminders 1 day before deadlines and on the due date.';

  return dispatchNotification(title, {
    body,
    tag: 'uniplanner-test-notification',
  });
}

/**
 * Checks all upcoming assessments and triggers notifications for assessments due today or tomorrow.
 * Employs anti-spam cache to guarantee only one notification per assessment per day.
 */
export async function checkAndTriggerDueNotifications(
  assessments: Assessment[],
  lang: Language = 'en'
): Promise<number> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return 0;
  }

  // Check if notifications are enabled in user settings
  const isEnabled = safeGetItem<boolean>(STORAGE_KEYS.NOTIFICATIONS_ENABLED, false);
  if (!isEnabled) {
    return 0;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const cache = safeGetItem<NotifiedCache>(NOTIFIED_CACHE_KEY, {});
  const isBn = lang === 'bn';
  let sentCount = 0;

  for (const a of assessments) {
    if (!a.dueDate) continue;

    const urgency = getAssessmentUrgency(a.dueDate, undefined, lang);

    // Only notify if Due Today or Due Tomorrow
    if (urgency.level !== 'today' && urgency.level !== 'tomorrow') {
      continue;
    }

    const reminderType = urgency.level; // 'today' | 'tomorrow'
    const cacheKey = `${a.id}_${reminderType}`;

    // Skip if already sent today for this assessment reminder type
    if (cache[cacheKey] === todayStr) {
      continue;
    }

    let title = '';
    let body = '';

    if (reminderType === 'today') {
      title = isBn
        ? `⚠️ আজকের ডেডলাইন: ${a.courseCode}`
        : `⚠️ Due Today: ${a.courseCode}`;
      body = isBn
        ? `আজকে "${a.title}" জমা দেওয়ার শেষ দিন (${a.type} • ${a.maxMarks} মার্কস)`
        : `Today is the deadline for "${a.title}" (${a.type} • ${a.maxMarks} marks)`;
    } else {
      title = isBn
        ? `🔔 কালকে ডেডলাইন: ${a.courseCode}`
        : `🔔 Due Tomorrow: ${a.courseCode}`;
      body = isBn
        ? `আগামীকাল "${a.title}" সম্পন্ন করার শেষ সময় (${a.type} • ${a.maxMarks} মার্কস)`
        : `Tomorrow is the due date for "${a.title}" (${a.type} • ${a.maxMarks} marks)`;
    }

    const success = await dispatchNotification(title, {
      body,
      tag: `uniplanner-asm-${a.id}`,
    });

    if (success) {
      cache[cacheKey] = todayStr;
      sentCount++;
    }
  }

  if (sentCount > 0) {
    safeSetItem(NOTIFIED_CACHE_KEY, cache);
  }

  return sentCount;
}
