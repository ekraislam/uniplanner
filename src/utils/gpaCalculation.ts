import type {
  Course,
  Assessment,
  GpaGradingConfig,
  SemesterGpaResult,
  CumulativeGpaResult,
  CourseGpaItem,
} from '../types';
import { analyzeCourseGrades } from './gradeAnalysis';

/**
 * Provides standard GPA grading scale configurations.
 * Students can customize these or define custom rules for their university.
 */
export function getDefaultGpaConfig(scaleType: '4.0' | '4.0_ugc' | '4.33' | '5.0' | 'percentage'): GpaGradingConfig {
  switch (scaleType) {
    case '4.0_ugc':
      return {
        scaleMax: 4.0,
        rules: [
          { grade: 'A+', gradePoint: 4.0, minPercentage: 80 },
          { grade: 'A', gradePoint: 3.75, minPercentage: 75 },
          { grade: 'A-', gradePoint: 3.5, minPercentage: 70 },
          { grade: 'B+', gradePoint: 3.25, minPercentage: 65 },
          { grade: 'B', gradePoint: 3.0, minPercentage: 60 },
          { grade: 'B-', gradePoint: 2.75, minPercentage: 55 },
          { grade: 'C+', gradePoint: 2.5, minPercentage: 50 },
          { grade: 'C', gradePoint: 2.25, minPercentage: 45 },
          { grade: 'D', gradePoint: 2.0, minPercentage: 40 },
          { grade: 'F', gradePoint: 0.0, minPercentage: 0 },
        ],
        minPassingGrade: 'D',
        minPassingGradePoint: 2.0,
      };

    case '4.33':
      return {
        scaleMax: 4.33,
        rules: [
          { grade: 'A+', gradePoint: 4.33, minPercentage: 90 },
          { grade: 'A', gradePoint: 4.0, minPercentage: 85 },
          { grade: 'A-', gradePoint: 3.7, minPercentage: 80 },
          { grade: 'B+', gradePoint: 3.3, minPercentage: 77 },
          { grade: 'B', gradePoint: 3.0, minPercentage: 73 },
          { grade: 'B-', gradePoint: 2.7, minPercentage: 70 },
          { grade: 'C+', gradePoint: 2.3, minPercentage: 65 },
          { grade: 'C', gradePoint: 2.0, minPercentage: 60 },
          { grade: 'C-', gradePoint: 1.7, minPercentage: 55 },
          { grade: 'D', gradePoint: 1.0, minPercentage: 50 },
          { grade: 'F', gradePoint: 0.0, minPercentage: 0 },
        ],
        minPassingGrade: 'D',
        minPassingGradePoint: 1.0,
      };

    case '5.0':
      return {
        scaleMax: 5.0,
        rules: [
          { grade: 'A+', gradePoint: 5.0, minPercentage: 90 },
          { grade: 'A', gradePoint: 4.5, minPercentage: 85 },
          { grade: 'B+', gradePoint: 4.0, minPercentage: 80 },
          { grade: 'B', gradePoint: 3.5, minPercentage: 75 },
          { grade: 'C+', gradePoint: 3.0, minPercentage: 70 },
          { grade: 'C', gradePoint: 2.5, minPercentage: 65 },
          { grade: 'D', gradePoint: 2.0, minPercentage: 50 },
          { grade: 'F', gradePoint: 0.0, minPercentage: 0 },
        ],
        minPassingGrade: 'D',
        minPassingGradePoint: 2.0,
      };

    case 'percentage':
      return {
        scaleMax: 100.0,
        rules: [
          { grade: 'High Distinction', gradePoint: 100, minPercentage: 85 },
          { grade: 'Distinction', gradePoint: 80, minPercentage: 75 },
          { grade: 'Credit', gradePoint: 70, minPercentage: 65 },
          { grade: 'Pass', gradePoint: 50, minPercentage: 50 },
          { grade: 'Fail', gradePoint: 0, minPercentage: 0 },
        ],
        minPassingGrade: 'Pass',
        minPassingGradePoint: 50,
      };

    case '4.0':
    default:
      return {
        scaleMax: 4.0,
        rules: [
          { grade: 'A', gradePoint: 4.0, minPercentage: 90 },
          { grade: 'A-', gradePoint: 3.7, minPercentage: 85 },
          { grade: 'B+', gradePoint: 3.3, minPercentage: 80 },
          { grade: 'B', gradePoint: 3.0, minPercentage: 75 },
          { grade: 'B-', gradePoint: 2.7, minPercentage: 70 },
          { grade: 'C+', gradePoint: 2.3, minPercentage: 65 },
          { grade: 'C', gradePoint: 2.0, minPercentage: 60 },
          { grade: 'C-', gradePoint: 1.7, minPercentage: 55 },
          { grade: 'D', gradePoint: 1.0, minPercentage: 50 },
          { grade: 'F', gradePoint: 0.0, minPercentage: 0 },
        ],
        minPassingGrade: 'D',
        minPassingGradePoint: 1.0,
      };
  }
}

/**
 * Validates GPA grading rules configuration.
 * Checks for duplicate grade labels, invalid grade points, contradictory thresholds,
 * and values outside the configured scale.
 */
export function validateGpaConfig(config: GpaGradingConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof config.scaleMax !== 'number' || isNaN(config.scaleMax) || config.scaleMax <= 0) {
    errors.push('GPA scale maximum must be a positive number (e.g. 4.0, 4.33, 5.0).');
  }

  if (!Array.isArray(config.rules) || config.rules.length === 0) {
    errors.push('At least one grade rule must be defined.');
    return { isValid: false, errors };
  }

  const seenGrades = new Set<string>();

  for (let i = 0; i < config.rules.length; i++) {
    const rule = config.rules[i];
    const gradeLabel = rule.grade ? rule.grade.trim() : '';

    if (!gradeLabel) {
      errors.push(`Grade rule #${i + 1} must have a letter grade label.`);
    } else {
      const norm = gradeLabel.toUpperCase();
      if (seenGrades.has(norm)) {
        errors.push(`Duplicate grade label "${gradeLabel}". Each grade letter must be unique.`);
      }
      seenGrades.add(norm);
    }

    if (typeof rule.gradePoint !== 'number' || isNaN(rule.gradePoint) || rule.gradePoint < 0) {
      errors.push(`Grade "${gradeLabel || `#${i + 1}`}" point must be a non-negative number.`);
    } else if (config.scaleMax > 0 && rule.gradePoint > config.scaleMax + 0.001) {
      errors.push(
        `Grade "${gradeLabel}" point (${rule.gradePoint}) cannot exceed the scale maximum (${config.scaleMax}).`
      );
    }

    if (rule.minPercentage !== undefined && rule.minPercentage !== null) {
      if (typeof rule.minPercentage !== 'number' || isNaN(rule.minPercentage) || rule.minPercentage < 0 || rule.minPercentage > 100) {
        errors.push(`Grade "${gradeLabel}" minimum percentage must be between 0% and 100%.`);
      }
    }
  }

  // Validate contradictory percentage thresholds (if defined for all or most rules)
  const rulesWithPct = config.rules.filter(
    (r) => typeof r.minPercentage === 'number' && !isNaN(r.minPercentage)
  );

  if (rulesWithPct.length >= 2) {
    // Check if higher grade points correspond to higher percentage thresholds
    for (let i = 0; i < rulesWithPct.length; i++) {
      for (let j = i + 1; j < rulesWithPct.length; j++) {
        const r1 = rulesWithPct[i];
        const r2 = rulesWithPct[j];
        if (r1.gradePoint > r2.gradePoint && (r1.minPercentage as number) < (r2.minPercentage as number)) {
          errors.push(
            `Contradictory threshold: Grade "${r1.grade}" (${r1.gradePoint} pts, min ${r1.minPercentage}%) requires a lower percentage than lower grade "${r2.grade}" (${r2.gradePoint} pts, min ${r2.minPercentage}%).`
          );
        } else if (r1.gradePoint < r2.gradePoint && (r1.minPercentage as number) > (r2.minPercentage as number)) {
          errors.push(
            `Contradictory threshold: Grade "${r2.grade}" (${r2.gradePoint} pts, min ${r2.minPercentage}%) requires a lower percentage than lower grade "${r1.grade}" (${r1.gradePoint} pts, min ${r1.minPercentage}%).`
          );
        }
      }
    }
  }

  // Validate min passing grade if provided
  if (config.minPassingGrade && config.minPassingGrade.trim()) {
    const passingNorm = config.minPassingGrade.trim().toUpperCase();
    if (!seenGrades.has(passingNorm)) {
      errors.push(`Minimum passing grade "${config.minPassingGrade}" is not in the defined grade rules.`);
    }
  }

  // Validate min passing grade point if provided
  if (config.minPassingGradePoint !== undefined && config.minPassingGradePoint !== null) {
    if (typeof config.minPassingGradePoint !== 'number' || isNaN(config.minPassingGradePoint) || config.minPassingGradePoint < 0) {
      errors.push('Minimum passing grade point must be non-negative.');
    } else if (config.scaleMax > 0 && config.minPassingGradePoint > config.scaleMax) {
      errors.push(`Minimum passing grade point (${config.minPassingGradePoint}) cannot exceed scale maximum (${config.scaleMax}).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Looks up the grade point corresponding to a letter grade from grading rules.
 */
export function getGradePointForGrade(grade: string, config: GpaGradingConfig): number | null {
  if (!grade || !config?.rules) return null;
  const norm = grade.trim().toUpperCase();
  const rule = config.rules.find((r) => r.grade.trim().toUpperCase() === norm);
  return rule ? rule.gradePoint : null;
}

/**
 * Estimates a grade and percentage based on assessed marks from course analysis.
 * NOTE: This is strictly an estimate based on current work and NEVER treated as official.
 */
export function estimateGradeFromMarks(
  course: Course,
  assessments: Assessment[],
  config: GpaGradingConfig
): { grade?: string; percentage?: number } | null {
  if (!course.gradingConfig?.isComplete) return null;

  const analysis = analyzeCourseGrades(course, assessments);
  if (analysis.confirmedAssessedPercentage === null) return null;

  const pct = analysis.confirmedAssessedPercentage;

  // First, check course's own configured grade boundaries if available
  if (course.gradingConfig.gradeBoundaries?.length > 0 && course.gradingConfig.totalCourseMarks > 0) {
    const sortedBoundaries = [...course.gradingConfig.gradeBoundaries].sort((a, b) => b.minMarks - a.minMarks);
    const matchedBoundary = sortedBoundaries.find((b) => {
      const boundaryPct = (b.minMarks / course.gradingConfig!.totalCourseMarks) * 100;
      return pct >= boundaryPct;
    });
    if (matchedBoundary) {
      return {
        grade: matchedBoundary.grade,
        percentage: pct,
      };
    }
  }

  // Fallback: match against global GPA config rules
  const sortedRules = [...config.rules]
    .filter((r) => typeof r.minPercentage === 'number')
    .sort((a, b) => (b.minPercentage ?? 0) - (a.minPercentage ?? 0));

  const matched = sortedRules.find((r) => pct >= (r.minPercentage ?? 0));
  if (matched) {
    return {
      grade: matched.grade,
      percentage: pct,
    };
  }

  return {
    grade: sortedRules[sortedRules.length - 1]?.grade,
    percentage: pct,
  };
}

/**
 * Calculates Semester GPA using the standard weighted credit formula:
 * Semester GPA = sum of (course credit * course grade point) / sum of credits for courses included
 *
 * Excludes courses with pending final grades (unless simulated).
 * Handles 0 credits and empty semesters safely without NaN or division by zero.
 */
export function calculateSemesterGpa(
  courses: Course[],
  assessments: Assessment[],
  semester: string,
  config: GpaGradingConfig,
  excludedCourseIds: Set<string> = new Set(),
  simulatedGrades: Record<string, string> = {}
): SemesterGpaResult {
  const termCourses = courses.filter((c) => semester === '__ALL__' || c.semester === semester);

  let totalCredits = 0;
  let includedCredits = 0;
  let pendingCredits = 0;
  let includedCoursesCount = 0;
  let pendingCoursesCount = 0;
  let totalQualityPoints = 0;

  // Simulation accumulators
  let simIncludedCredits = 0;
  let simTotalQualityPoints = 0;
  let simulatedCoursesApplied = 0;

  const items: CourseGpaItem[] = termCourses.map((c) => {
    totalCredits += c.credits;

    const isIncluded = !excludedCourseIds.has(c.id);
    const confirmedGrade = c.finalGrade ? c.finalGrade.trim() : undefined;
    const confirmedGradePoint =
      confirmedGrade !== undefined
        ? c.finalGradePoint ?? getGradePointForGrade(confirmedGrade, config) ?? 0
        : undefined;

    const isPending = confirmedGrade === undefined;

    if (isPending) {
      pendingCredits += c.credits;
      pendingCoursesCount++;
    }

    // Estimate from assessment work
    const marksEstimate = isPending ? estimateGradeFromMarks(c, assessments, config) : null;

    // Simulation grade
    const simGrade = simulatedGrades[c.id] ? simulatedGrades[c.id].trim() : undefined;
    const simGradePoint = simGrade ? getGradePointForGrade(simGrade, config) ?? 0 : undefined;

    // A course is actively simulated if a simGrade is provided and either:
    // 1. It is pending
    // 2. Or it is confirmed, but the user wants to test a retake/improvement with a different grade
    const isActivelySimulatingCourse =
      simGrade !== undefined && (isPending || simGrade !== confirmedGrade);

    if (isActivelySimulatingCourse) {
      simulatedCoursesApplied++;
    }

    // Confirmed calculation (unaffected by simulation)
    if (isIncluded && !isPending && confirmedGradePoint !== undefined) {
      includedCredits += c.credits;
      includedCoursesCount++;
      totalQualityPoints += c.credits * confirmedGradePoint;
    }

    // Simulated calculation
    // Effective grade point: if actively simulated, use simGradePoint!
    // Otherwise fallback to confirmedGradePoint if confirmed.
    const effectiveGradePoint =
      isActivelySimulatingCourse && simGradePoint !== undefined
        ? simGradePoint
        : !isPending && confirmedGradePoint !== undefined
        ? confirmedGradePoint
        : undefined;

    if (isIncluded && effectiveGradePoint !== undefined) {
      simIncludedCredits += c.credits;
      simTotalQualityPoints += c.credits * effectiveGradePoint;
    }

    return {
      courseId: c.id,
      courseCode: c.code,
      courseName: c.name,
      credits: c.credits,
      semester: c.semester,
      color: c.color,
      confirmedGrade,
      confirmedGradePoint,
      isPending,
      isIncluded,
      simulatedGrade: simGrade,
      simulatedGradePoint: simGradePoint,
      effectiveGradePoint,
      estimatedGradeFromMarks: marksEstimate?.grade,
      estimatedPercentageFromMarks: marksEstimate?.percentage,
    };
  });

  // Confirmed GPA
  const gpa = includedCredits > 0 ? totalQualityPoints / includedCredits : null;
  const gpaFormatted = gpa !== null ? gpa.toFixed(2) : '—';

  // Simulated GPA (only computed when at least one hypothetical grade is simulated)
  const isSimulating = simulatedCoursesApplied > 0;
  const simulatedGpa = isSimulating && simIncludedCredits > 0 ? simTotalQualityPoints / simIncludedCredits : null;
  const simulatedGpaFormatted = simulatedGpa !== null ? simulatedGpa.toFixed(2) : '—';

  return {
    semester,
    totalCourses: termCourses.length,
    includedCourses: includedCoursesCount,
    pendingCourses: pendingCoursesCount,
    totalCredits,
    includedCredits,
    pendingCredits,
    totalQualityPoints,
    gpa,
    gpaFormatted,
    simulatedGpa,
    simulatedGpaFormatted,
    isSimulating,
    simulatedCoursesCount: simulatedCoursesApplied,
    items,
  };
}

/**
 * Calculates Cumulative GPA across all confirmed courses across all semesters.
 * Strictly uses official confirmed grades only.
 * Returns null / '—' if no confirmed courses exist or 0 confirmed credits.
 */
export function calculateCumulativeGpa(
  allCourses: Course[],
  config: GpaGradingConfig
): CumulativeGpaResult {
  let totalCourses = allCourses.length;
  let confirmedCourses = 0;
  let pendingCourses = 0;
  let totalCredits = 0;
  let confirmedCredits = 0;
  let pendingCredits = 0;
  let totalQualityPoints = 0;

  for (const c of allCourses) {
    totalCredits += c.credits;

    if (c.finalGrade && c.finalGrade.trim()) {
      const gp = c.finalGradePoint ?? getGradePointForGrade(c.finalGrade, config) ?? 0;
      confirmedCourses++;
      confirmedCredits += c.credits;
      totalQualityPoints += c.credits * gp;
    } else {
      pendingCourses++;
      pendingCredits += c.credits;
    }
  }

  const gpa = confirmedCredits > 0 ? totalQualityPoints / confirmedCredits : null;
  const gpaFormatted = gpa !== null ? gpa.toFixed(2) : '—';

  return {
    totalCourses,
    confirmedCourses,
    pendingCourses,
    totalCredits,
    confirmedCredits,
    pendingCredits,
    totalQualityPoints,
    gpa,
    gpaFormatted,
  };
}
