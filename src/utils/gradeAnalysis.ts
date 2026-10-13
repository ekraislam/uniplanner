import type {
  Course,
  Assessment,
  CourseGradingConfig,
  CourseGradeAnalysis,
  CategoryAnalysisItem,
  TargetGradeAnalysis,
} from '../types';

/**
 * Validates a course grading configuration.
 */
export function validateGradingConfig(config: CourseGradingConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Total course marks validation
  if (typeof config.totalCourseMarks !== 'number' || isNaN(config.totalCourseMarks) || config.totalCourseMarks <= 0) {
    errors.push('Total course marks must be a positive number greater than 0.');
  }

  // Categories validation
  if (!Array.isArray(config.categories) || config.categories.length === 0) {
    errors.push('At least one assessment category is required (e.g. Midterm, Final Exam).');
  } else {
    let categorySum = 0;
    const seenNames = new Set<string>();

    for (let i = 0; i < config.categories.length; i++) {
      const cat = config.categories[i];
      if (!cat.name || !cat.name.trim()) {
        errors.push(`Category #${i + 1} must have a name.`);
      } else {
        const normName = cat.name.trim().toLowerCase();
        if (seenNames.has(normName)) {
          errors.push(`Category name "${cat.name.trim()}" is duplicated. Category names must be distinct.`);
        }
        seenNames.add(normName);
      }

      if (typeof cat.maxMarks !== 'number' || isNaN(cat.maxMarks) || cat.maxMarks < 0) {
        errors.push(`Category "${cat.name || `#${i + 1}`}" maximum marks must be non-negative.`);
      } else {
        categorySum += cat.maxMarks;
      }
    }

    if (config.totalCourseMarks > 0 && Math.abs(categorySum - config.totalCourseMarks) > 0.01) {
      const diff = config.totalCourseMarks - categorySum;
      errors.push(
        `Category marks sum to ${categorySum.toFixed(1)}, but total course marks is configured as ${config.totalCourseMarks.toFixed(1)}. Difference: ${diff > 0 ? `+${diff.toFixed(1)} unallocated` : `${diff.toFixed(1)} overflow`}.`
      );
    }
  }

  // Grade boundaries validation
  if (!Array.isArray(config.gradeBoundaries) || config.gradeBoundaries.length === 0) {
    errors.push('At least one grade boundary is required (e.g. A >= 80, B >= 70, Pass >= 50).');
  } else {
    const seenGrades = new Set<string>();
    for (const gb of config.gradeBoundaries) {
      if (!gb.grade || !gb.grade.trim()) {
        errors.push('Each grade boundary must have a grade label (e.g. A, B+, Pass).');
      } else {
        const normGrade = gb.grade.trim().toUpperCase();
        if (seenGrades.has(normGrade)) {
          errors.push(`Duplicate grade label "${gb.grade.trim()}". Each boundary must have a unique label.`);
        }
        seenGrades.add(normGrade);
      }

      if (typeof gb.minMarks !== 'number' || isNaN(gb.minMarks) || gb.minMarks < 0) {
        errors.push(`Grade "${gb.grade}" minimum marks must be a non-negative number.`);
      } else if (config.totalCourseMarks > 0 && gb.minMarks > config.totalCourseMarks) {
        errors.push(
          `Grade "${gb.grade}" requires ${gb.minMarks} marks, which exceeds total course marks (${config.totalCourseMarks}).`
        );
      }
    }
  }

  // Passing marks validation
  if (config.passingMarks !== undefined && config.passingMarks !== null) {
    if (typeof config.passingMarks !== 'number' || isNaN(config.passingMarks) || config.passingMarks < 0) {
      errors.push('Minimum passing marks must be non-negative.');
    } else if (config.totalCourseMarks > 0 && config.passingMarks > config.totalCourseMarks) {
      errors.push(`Passing marks (${config.passingMarks}) cannot exceed total course marks (${config.totalCourseMarks}).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates complete grade analysis, confirmed/pending breakdowns, and target forecast.
 */
export function analyzeCourseGrades(
  course: Course,
  allAssessments: Assessment[],
  selectedTargetGrade?: string
): CourseGradeAnalysis {
  const courseAssessments = allAssessments.filter((a) => a.courseId === course.id);
  const config = course.gradingConfig;

  // Empty or unconfigured state
  if (!config || !config.isComplete || !Array.isArray(config.categories) || config.categories.length === 0) {
    return {
      totalCourseMarks: config?.totalCourseMarks || 100,
      totalConfirmedMarks: 0,
      totalAssessedMarks: 0,
      totalPendingOrUnassessedMarks: config?.totalCourseMarks || 100,
      maxMarksStillAvailable: config?.totalCourseMarks || 100,
      confirmedAssessedPercentage: null,
      confirmedTotalPercentage: 0,
      maxPossiblePercentage: 100,
      categoryBreakdown: [],
      isGradingConfigured: false,
      hasConflicts: false,
    };
  }

  let totalConfirmedMarks = 0;
  let totalAssessedMarks = 0;
  let hasConflicts = false;

  const categoryBreakdown: CategoryAnalysisItem[] = config.categories.map((cat) => {
    // Linked assessments
    const linked = courseAssessments.filter((a) => a.categoryId === cat.id);

    // Sum of maxMarks across linked assessments
    const rawAssessedCapacity = linked.reduce((sum, a) => sum + a.maxMarks, 0);

    // Conflict detection: assessments capacity exceeds configured category limit
    const hasConflict = rawAssessedCapacity > cat.maxMarks;
    if (hasConflict) {
      hasConflicts = true;
    }

    // Released assessments (obtainedMarks !== null && !== undefined)
    const released = linked.filter((a) => a.obtainedMarks !== null && a.obtainedMarks !== undefined);
    
    // Sum obtained marks
    const rawObtained = released.reduce((sum, a) => sum + (a.obtainedMarks as number), 0);
    const rawReleasedMax = released.reduce((sum, a) => sum + a.maxMarks, 0);

    // Cap confirmed marks at category capacity to prevent double-counting
    const confirmedMarks = Math.min(cat.maxMarks, rawObtained);
    const assessedMaxMarks = Math.min(cat.maxMarks, rawReleasedMax);

    // Lost marks in released assessments
    const lostMarks = Math.max(0, assessedMaxMarks - confirmedMarks);

    // Pending capacity in this category
    const pendingCapacity = Math.max(0, cat.maxMarks - assessedMaxMarks);

    totalConfirmedMarks += confirmedMarks;
    totalAssessedMarks += assessedMaxMarks;

    return {
      category: cat,
      assessments: linked,
      confirmedMarks,
      assessedMaxMarks,
      pendingCapacity,
      lostMarks,
      hasConflict,
    };
  });

  const totalCourseMarks = config.totalCourseMarks;
  const totalPendingOrUnassessedMarks = Math.max(0, totalCourseMarks - totalAssessedMarks);
  const maxMarksStillAvailable = Math.min(totalCourseMarks, totalConfirmedMarks + totalPendingOrUnassessedMarks);

  const confirmedAssessedPercentage =
    totalAssessedMarks > 0 ? (totalConfirmedMarks / totalAssessedMarks) * 100 : null;
  const confirmedTotalPercentage = (totalConfirmedMarks / totalCourseMarks) * 100;
  const maxPossiblePercentage = (maxMarksStillAvailable / totalCourseMarks) * 100;

  // Target Grade Analysis
  let targetAnalysis: TargetGradeAnalysis | undefined = undefined;

  // Resolve target boundary
  const targetLabel = selectedTargetGrade || course.targetGrade || config.gradeBoundaries[0]?.grade;
  const boundary = config.gradeBoundaries.find(
    (gb) => gb.grade.toLowerCase() === targetLabel?.toLowerCase()
  );

  if (boundary) {
    const minMarks = boundary.minMarks;
    const marksNeeded = Math.max(0, minMarks - totalConfirmedMarks);
    const remainingAvailableMarks = totalPendingOrUnassessedMarks;

    if (totalConfirmedMarks >= minMarks) {
      // Case 1: Target is already achieved
      targetAnalysis = {
        status: 'achieved',
        targetGrade: boundary.grade,
        targetMinMarks: minMarks,
        marksNeeded: 0,
        remainingAvailableMarks,
        requiredRemainingPercentage: 0,
        message: `Goal achieved! You have confirmed ${totalConfirmedMarks.toFixed(1)} marks, securing grade "${boundary.grade}" (threshold: ${minMarks}).`,
      };
    } else if (maxMarksStillAvailable < minMarks) {
      // Case 2: Target is impossible
      targetAnalysis = {
        status: 'impossible',
        targetGrade: boundary.grade,
        targetMinMarks: minMarks,
        marksNeeded,
        remainingAvailableMarks,
        requiredRemainingPercentage: null,
        message: `Grade "${boundary.grade}" is mathematically unachievable. You need ${marksNeeded.toFixed(1)} more marks, but only ${remainingAvailableMarks.toFixed(1)} marks remain available. Maximum possible final score is ${maxMarksStillAvailable.toFixed(1)} / ${totalCourseMarks}.`,
      };
    } else if (totalAssessedMarks === 0 && courseAssessments.length > 0) {
      // Case 3: Results pending
      const reqPercent = remainingAvailableMarks > 0 ? (marksNeeded / remainingAvailableMarks) * 100 : 0;
      targetAnalysis = {
        status: 'pending',
        targetGrade: boundary.grade,
        targetMinMarks: minMarks,
        marksNeeded,
        remainingAvailableMarks,
        requiredRemainingPercentage: Math.min(100, reqPercent),
        message: `All current assessment results are pending. You require ${marksNeeded.toFixed(1)} marks (${reqPercent.toFixed(1)}%) across remaining work for grade "${boundary.grade}".`,
      };
    } else {
      // Case 4: Target is still achievable
      const reqPercent = remainingAvailableMarks > 0 ? (marksNeeded / remainingAvailableMarks) * 100 : 0;
      targetAnalysis = {
        status: 'achievable',
        targetGrade: boundary.grade,
        targetMinMarks: minMarks,
        marksNeeded,
        remainingAvailableMarks,
        requiredRemainingPercentage: Math.min(100, reqPercent),
        message: `Achievable! You need ${marksNeeded.toFixed(1)} additional marks out of ${remainingAvailableMarks.toFixed(1)} remaining available (${reqPercent.toFixed(1)}% average required on pending work) for grade "${boundary.grade}".`,
      };
    }
  } else {
    targetAnalysis = {
      status: 'insufficient_info',
      targetGrade: targetLabel || 'Unspecified',
      targetMinMarks: 0,
      marksNeeded: 0,
      remainingAvailableMarks: totalPendingOrUnassessedMarks,
      requiredRemainingPercentage: null,
      message: 'Select or configure a valid grade boundary to forecast target feasibility.',
    };
  }

  return {
    totalCourseMarks,
    totalConfirmedMarks,
    totalAssessedMarks,
    totalPendingOrUnassessedMarks,
    maxMarksStillAvailable,
    confirmedAssessedPercentage,
    confirmedTotalPercentage,
    maxPossiblePercentage,
    categoryBreakdown,
    isGradingConfigured: true,
    hasConflicts,
    targetAnalysis,
  };
}
