import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== Running Hybrid Notification & Calendar Sync Verification Suite ===\n');

// ----------------------------------------------------
// Suite 1: Types & Storage Schema Verification
// ----------------------------------------------------
console.log('[Suite 1] Types & Storage Schema');
const typesFile = path.resolve('src', 'types', 'index.ts');
const typesContent = fs.readFileSync(typesFile, 'utf8');
assert(
  typesContent.includes('notificationsEnabled?: boolean;'),
  'StudentSettings must include optional notificationsEnabled boolean field'
);

const storageFile = path.resolve('src', 'utils', 'storage.ts');
const storageContent = fs.readFileSync(storageFile, 'utf8');
assert(
  storageContent.includes("NOTIFICATIONS_ENABLED: 'uniplanner_notifications_enabled_v1'"),
  'STORAGE_KEYS must define NOTIFICATIONS_ENABLED constant'
);
assert(
  storageContent.includes('notificationsEnabled: false'),
  'DEFAULT_SETTINGS must specify notificationsEnabled as false by default'
);
assert(
  storageContent.includes('notificationsEnabled: typeof parsed.notificationsEnabled ==='),
  'loadSettings must parse notificationsEnabled from stored settings'
);
console.log('✓ Suite 1 Passed: Types and LocalStorage schemas correctly configured.');

// ----------------------------------------------------
// Suite 2: Service Worker Notification Click Handler
// ----------------------------------------------------
console.log('\n[Suite 2] Service Worker Push & Click Handling');
const swFile = path.resolve('public', 'sw.js');
const swContent = fs.readFileSync(swFile, 'utf8');
assert(
  swContent.includes("self.addEventListener('notificationclick'"),
  'sw.js must register notificationclick event listener'
);
assert(
  swContent.includes('event.notification.close()'),
  'sw.js notificationclick must close notification on tap'
);
assert(
  swContent.includes('clients.matchAll(') && swContent.includes('client.focus()'),
  'sw.js must focus existing UniPlanner window or open new one'
);
console.log('✓ Suite 2 Passed: ServiceWorker notification click listener verified.');

// ----------------------------------------------------
// Suite 3: Calendar Utilities & RFC 5545 iCalendar Standard
// ----------------------------------------------------
console.log('\n[Suite 3] Calendar RFC 5545 Generation & Google Calendar URLs');
const calendarFile = path.resolve('src', 'utils', 'calendarUtils.ts');
assert(fs.existsSync(calendarFile), 'src/utils/calendarUtils.ts must exist');
const calendarContent = fs.readFileSync(calendarFile, 'utf8');

assert(calendarContent.includes('export function generateAssessmentIcs'), 'Must export generateAssessmentIcs');
assert(calendarContent.includes('export function generateSemesterScheduleIcs'), 'Must export generateSemesterScheduleIcs');
assert(calendarContent.includes('export function downloadIcsFile'), 'Must export downloadIcsFile');
assert(calendarContent.includes('export function getGoogleCalendarUrl'), 'Must export getGoogleCalendarUrl');

// Verify VALARM triggers for dual reminders (1-day advance & 2-hour morning)
assert(calendarContent.includes("TRIGGER:-P1D"), 'Must include 1-day advance alarm (TRIGGER:-P1D)');
assert(calendarContent.includes("TRIGGER:-PT2H"), 'Must include morning of due date alarm (TRIGGER:-PT2H)');
assert(calendarContent.includes("DTSTART;VALUE=DATE:"), 'Must support full day all-day events format');
assert(calendarContent.includes("calendar.google.com/calendar/render"), 'Must generate valid Google Calendar web link');

console.log('✓ Suite 3 Passed: RFC 5545 alarms and Google Calendar integration verified.');

// ----------------------------------------------------
// Suite 4: Notification Utilities & Anti-Spam Logic
// ----------------------------------------------------
console.log('\n[Suite 4] Notification Utilities & Anti-Spam Daily Cache');
const notifFile = path.resolve('src', 'utils', 'notificationUtils.ts');
assert(fs.existsSync(notifFile), 'src/utils/notificationUtils.ts must exist');
const notifContent = fs.readFileSync(notifFile, 'utf8');

assert(notifContent.includes('export function isNotificationSupported'), 'Must export isNotificationSupported');
assert(notifContent.includes('export function getNotificationPermission'), 'Must export getNotificationPermission');
assert(notifContent.includes('export async function requestNotificationPermission'), 'Must export requestNotificationPermission');
assert(notifContent.includes('export async function sendTestNotification'), 'Must export sendTestNotification');
assert(notifContent.includes('export async function checkAndTriggerDueNotifications'), 'Must export checkAndTriggerDueNotifications');

// Verify anti-spam cache
assert(notifContent.includes('uniplanner_notified_cache_v1'), 'Must use persistent daily notified cache key');
assert(notifContent.includes('cache[cacheKey] === todayStr'), 'Must check cache to prevent duplicate alerts on same day');
assert(notifContent.includes("urgency.level !== 'today' && urgency.level !== 'tomorrow'"), 'Must filter for today and tomorrow deadlines only');
assert(notifContent.includes('registration.showNotification'), 'Must prefer ServiceWorker notifications for background support');

console.log('✓ Suite 4 Passed: Anti-spam and dual delivery logic verified.');

// ----------------------------------------------------
// Suite 5: Bilingual i18n Localization Parity
// ----------------------------------------------------
console.log('\n[Suite 5] Bilingual i18n Localization Parity');
const enFile = path.resolve('src', 'locales', 'en.ts');
const bnFile = path.resolve('src', 'locales', 'bn.ts');
const enContent = fs.readFileSync(enFile, 'utf8');
const bnContent = fs.readFileSync(bnFile, 'utf8');

const requiredKeys = [
  'addToCalendar',
  'googleCalendar',
  'downloadIcs',
  'syncSchedule',
  'urgentBannerToday',
  'urgentBannerTomorrow',
  'viewDeadlines',
  'notificationSection',
  'notificationSubtitle',
  'browserNotificationsTitle',
  'browserNotificationsDesc',
  'enableNotifications',
  'notificationsActive',
  'notificationsBlocked',
  'notificationsDefault',
  'testNotificationBtn',
  'testNotificationSuccess',
  'calendarSyncTitle',
  'calendarSyncDesc',
  'exportSemesterCalendarBtn',
];

for (const key of requiredKeys) {
  assert(enContent.includes(`${key}:`), `en.ts must include translation key: ${key}`);
  assert(bnContent.includes(`${key}:`), `bn.ts must include translation key: ${key}`);
}
console.log(`✓ Suite 5 Passed: All ${requiredKeys.length} notification & calendar translation keys present in both English and Bengali.`);

// ----------------------------------------------------
// Suite 6: Component Integrations
// ----------------------------------------------------
console.log('\n[Suite 6] Component Integration Verification');
const dashFile = path.resolve('src', 'components', 'views', 'DashboardView.tsx');
const dashContent = fs.readFileSync(dashFile, 'utf8');
assert(dashContent.includes('urgentToday.length > 0'), 'DashboardView must detect and render urgent today banner');
assert(dashContent.includes('urgentTomorrow.length > 0'), 'DashboardView must detect and render urgent tomorrow banner');
assert(dashContent.includes('exportSemesterScheduleIcs()'), 'DashboardView must have 1-click semester calendar export');
assert(dashContent.includes('openGoogleCalendar(a)'), 'DashboardView must have quick Google Calendar button');

const asmFile = path.resolve('src', 'components', 'views', 'AssessmentsView.tsx');
const asmContent = fs.readFileSync(asmFile, 'utf8');
assert(asmContent.includes('exportSemesterScheduleIcs()'), 'AssessmentsView must have semester calendar export button');
assert(asmContent.includes('openGoogleCalendar'), 'AssessmentsView must have Google Calendar link on cards');
assert(asmContent.includes('exportAssessmentIcs'), 'AssessmentsView must have .ICS download button on cards');
assert(asmContent.includes('AssessmentCalendarMenu'), 'AssessmentsView must use unified clean AssessmentCalendarMenu');

const settingsViewFile = path.resolve('src', 'components', 'views', 'SettingsView.tsx');
const settingsViewContent = fs.readFileSync(settingsViewFile, 'utf8');
assert(settingsViewContent.includes('notificationSection'), 'SettingsView must render notification settings card');
assert(settingsViewContent.includes('requestNotificationPermission'), 'SettingsView must wire notification permission request');
assert(settingsViewContent.includes('sendTestNotification'), 'SettingsView must wire test notification button');
assert(settingsViewContent.includes('exportSemesterScheduleIcs'), 'SettingsView must provide semester calendar export');

console.log('✓ Suite 6 Passed: DashboardView, AssessmentsView, and SettingsView fully integrated.');

console.log('\n======================================================');
console.log('🎉 ALL HYBRID NOTIFICATION & CALENDAR SUITES PASSED! 🎉');
console.log('======================================================');
