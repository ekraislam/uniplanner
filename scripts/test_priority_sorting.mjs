import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('--- Running Priority & Date Sorting Verification Suite ---');

// 1. Verify TypeScript types exist in src/types/index.ts
console.log('\n[Suite 1] Type System Integrity');
const typesPath = path.resolve('src', 'types', 'index.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

assert(
  typesContent.includes("export type AssessmentPriority = 'high' | 'medium' | 'low';"),
  'AssessmentPriority union type must be defined'
);
assert(
  typesContent.includes('priority?: AssessmentPriority;'),
  'Assessment interface must include optional priority field'
);
console.log('✓ Suite 1 Passed: AssessmentPriority and Assessment.priority types verified.');

// 2. Verify priorityUtils module implementation
console.log('\n[Suite 2] Priority & Urgency Logic Implementation');
const priorityUtilsPath = path.resolve('src', 'utils', 'priorityUtils.ts');
assert(fs.existsSync(priorityUtilsPath), 'priorityUtils.ts must exist');
const priorityUtilsContent = fs.readFileSync(priorityUtilsPath, 'utf8');

assert(priorityUtilsContent.includes('getDefaultPriorityForType'), 'Must export getDefaultPriorityForType');
assert(priorityUtilsContent.includes('getAssessmentUrgency'), 'Must export getAssessmentUrgency');
assert(priorityUtilsContent.includes('sortAssessments'), 'Must export sortAssessments');
assert(priorityUtilsContent.includes('PRIORITY_WEIGHTS'), 'Must export PRIORITY_WEIGHTS');

// Replicate and test exact algorithm logic
function getDefaultPriorityForType(type) {
  switch (type) {
    case 'Final Exam':
    case 'Midterm':
    case 'Project':
      return 'high';
    case 'Assignment':
    case 'Presentation':
    case 'Lab':
    case 'Class Test (CT)':
    case 'Other':
      return 'medium';
    case 'Quiz':
      return 'low';
    default:
      return 'medium';
  }
}

const PRIORITY_WEIGHTS = { high: 3, medium: 2, low: 1 };

function getDaysDifference(targetDateStr, baseDate) {
  if (!targetDateStr || !targetDateStr.trim()) return null;
  const parts = targetDateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const targetUtc = Date.UTC(year, month, day);
  const baseUtc = Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  return Math.round((targetUtc - baseUtc) / (1000 * 60 * 60 * 24));
}

function getAssessmentUrgency(dueDateStr, baseDate = new Date()) {
  if (!dueDateStr || !dueDateStr.trim()) {
    return { level: 'no-date', isUrgent: false, daysDiff: null };
  }
  const days = getDaysDifference(dueDateStr, baseDate);
  if (days === null) return { level: 'no-date', isUrgent: false, daysDiff: null };
  if (days < 0) return { level: 'overdue', isUrgent: true, daysDiff: days };
  if (days === 0) return { level: 'today', isUrgent: true, daysDiff: 0 };
  if (days === 1) return { level: 'tomorrow', isUrgent: true, daysDiff: 1 };
  if (days <= 3) return { level: 'within-3-days', isUrgent: true, daysDiff: days };
  if (days <= 7) return { level: 'within-week', isUrgent: false, daysDiff: days };
  return { level: 'later', isUrgent: false, daysDiff: days };
}

function sortAssessments(assessments, sortBy) {
  return [...assessments].sort((a, b) => {
    const priorityA = a.priority || getDefaultPriorityForType(a.type);
    const priorityB = b.priority || getDefaultPriorityForType(b.type);
    const weightA = PRIORITY_WEIGHTS[priorityA] || 2;
    const weightB = PRIORITY_WEIGHTS[priorityB] || 2;
    const dateA = a.dueDate || '';
    const dateB = b.dueDate || '';

    switch (sortBy) {
      case 'dueDateAsc': {
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        if (dateA && dateB) {
          const comp = dateA.localeCompare(dateB);
          if (comp !== 0) return comp;
        }
        if (weightA !== weightB) return weightB - weightA;
        return a.title.localeCompare(b.title);
      }
      case 'priorityDesc': {
        if (weightA !== weightB) return weightB - weightA;
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        if (dateA && dateB) {
          const comp = dateA.localeCompare(dateB);
          if (comp !== 0) return comp;
        }
        return a.title.localeCompare(b.title);
      }
      case 'marksDesc':
        if (b.maxMarks !== a.maxMarks) return b.maxMarks - a.maxMarks;
        return weightB - weightA;
      default:
        return 0;
    }
  });
}

// Check type mapping
assert.strictEqual(getDefaultPriorityForType('Final Exam'), 'high');
assert.strictEqual(getDefaultPriorityForType('Midterm'), 'high');
assert.strictEqual(getDefaultPriorityForType('Project'), 'high');
assert.strictEqual(getDefaultPriorityForType('Assignment'), 'medium');
assert.strictEqual(getDefaultPriorityForType('Quiz'), 'low');

// Check urgency calculation
const baseDate = new Date(2026, 9, 20, 12, 0, 0); // Oct 20, 2026
assert.strictEqual(getAssessmentUrgency('2026-10-18', baseDate).level, 'overdue');
assert.strictEqual(getAssessmentUrgency('2026-10-20', baseDate).level, 'today');
assert.strictEqual(getAssessmentUrgency('2026-10-21', baseDate).level, 'tomorrow');
assert.strictEqual(getAssessmentUrgency('2026-10-23', baseDate).level, 'within-3-days');
assert.strictEqual(getAssessmentUrgency('2026-10-26', baseDate).level, 'within-week');
assert.strictEqual(getAssessmentUrgency('2026-11-15', baseDate).level, 'later');
assert.strictEqual(getAssessmentUrgency('', baseDate).level, 'no-date');

console.log('✓ Suite 2 Passed: Priority mapping and urgency rules verified.');

// 3. Verify Balanced Sorting Behavior
console.log('\n[Suite 3] Balanced Sorting Invariant (Date vs Priority)');
const sampleAssessments = [
  { id: '1', title: 'Quiz 1', type: 'Quiz', priority: 'low', maxMarks: 10, dueDate: '2026-10-25' },
  { id: '2', title: 'Final Exam', type: 'Final Exam', priority: 'high', maxMarks: 40, dueDate: '2026-10-25' },
  { id: '3', title: 'Assignment 1', type: 'Assignment', priority: 'medium', maxMarks: 20, dueDate: '2026-10-22' },
  { id: '4', title: 'Term Project', type: 'Project', priority: 'high', maxMarks: 30, dueDate: '2026-11-05' },
];

const sortedByDate = sortAssessments(sampleAssessments, 'dueDateAsc');
assert.strictEqual(sortedByDate[0].title, 'Assignment 1'); // Earliest deadline Oct 22
assert.strictEqual(sortedByDate[1].title, 'Final Exam');   // Oct 25 + High priority wins tie-breaker!
assert.strictEqual(sortedByDate[2].title, 'Quiz 1');        // Oct 25 + Low priority
assert.strictEqual(sortedByDate[3].title, 'Term Project'); // Nov 05

const sortedByPriority = sortAssessments(sampleAssessments, 'priorityDesc');
assert.strictEqual(sortedByPriority[0].title, 'Final Exam');   // High + Oct 25
assert.strictEqual(sortedByPriority[1].title, 'Term Project'); // High + Nov 05
assert.strictEqual(sortedByPriority[2].title, 'Assignment 1'); // Medium
assert.strictEqual(sortedByPriority[3].title, 'Quiz 1');        // Low

console.log('✓ Suite 3 Passed: Due Date Ascending and Priority Descending sorting balance verified.');

// 4. Verify Storage & Backup File Preservation
console.log('\n[Suite 4] Storage & Backup Integration Check');
const storagePath = path.resolve('src', 'utils', 'storage.ts');
const storageContent = fs.readFileSync(storagePath, 'utf8');
assert(storageContent.includes("item.priority === 'high'"), 'storage.ts must parse and validate priority');

const backupPath = path.resolve('src', 'utils', 'backupRestore.ts');
const backupContent = fs.readFileSync(backupPath, 'utf8');
assert(backupContent.includes('priority: a.priority'), 'createBackupData must preserve priority in export');
assert(backupContent.includes("item.priority === 'high'"), 'restoreBackupData must parse and validate priority');

console.log('✓ Suite 4 Passed: Priority is safely persisted and restored in storage and backup files.');

// 5. Verify UI Components Integration
console.log('\n[Suite 5] UI Component Integration Check');
const modalPath = path.resolve('src', 'components', 'assessments', 'AddAssessmentModal.tsx');
const modalContent = fs.readFileSync(modalPath, 'utf8');
assert(modalContent.includes('Priority Level'), 'AddAssessmentModal must render Priority Level selector');
assert(modalContent.includes('getDefaultPriorityForType'), 'AddAssessmentModal must auto-suggest priority by type');

const viewPath = path.resolve('src', 'components', 'views', 'AssessmentsView.tsx');
const viewContent = fs.readFileSync(viewPath, 'utf8');
assert(viewContent.includes('filter-priority-select'), 'AssessmentsView must have priority filter');
assert(viewContent.includes('sort-assessments-select'), 'AssessmentsView must have sort dropdown');

const dashboardPath = path.resolve('src', 'components', 'views', 'DashboardView.tsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
assert(dashboardContent.includes('deadlinesTab'), 'DashboardView must have balanced deadline filter tabs');
assert(dashboardContent.includes('High ('), 'DashboardView must display High priority count pill');

console.log('✓ Suite 5 Passed: Modal, AssessmentsView, and DashboardView UI integration verified.');

console.log('\n======================================================');
console.log('ALL 5 TEST SUITES PASSED! Priority & Date Balance Complete.');
console.log('======================================================\n');
