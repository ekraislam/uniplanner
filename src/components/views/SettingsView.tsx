import React, { useState, useRef } from 'react';
import {
  Settings,
  UserCheck,
  ShieldAlert,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Database,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { usePlanner } from '../../context/usePlanner';
import { usePwa } from '../../hooks/usePwa';
import type {
  GpaGradingConfig,
  GpaScaleRule,
  UniPlannerBackupData,
  BackupPreviewInfo,
} from '../../types';
import { getDefaultGpaConfig, validateGpaConfig } from '../../utils/gpaCalculation';
import { validateBackupJson, formatBackupDate } from '../../utils/backupRestore';
import { RestoreBackupModal } from '../common/RestoreBackupModal';
import { Modal } from '../common/Modal';

const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getGradePillStyle = (grade: string) => {
  const g = grade.trim().toUpperCase();
  if (g.startsWith('A')) return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
  if (g.startsWith('B')) return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
  if (g.startsWith('C')) return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
  if (g.startsWith('D')) return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
  if (g.startsWith('F')) return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
  return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
};

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToEmptyData,
    lastBackupExportTime,
    triggerExportBackup,
    restoreFromBackup,
    openInstallModal,
    language,
    setLanguage,
    t,
  } = usePlanner();

  const {
    isOnline,
    isInstallable,
    isInstalled,
    hasUpdate,
    promptInstall,
    applyUpdate,
  } = usePwa();

  // Profile fields
  const [studentName, setStudentName] = useState(settings.studentName);
  const [universityName, setUniversityName] = useState(settings.universityName);
  const [degreeProgram, setDegreeProgram] = useState(settings.degreeProgram);
  const [gradingScale, setGradingScale] = useState(settings.gradingScale);
  const [currentTerm, setCurrentTerm] = useState(settings.currentTerm);
  const [targetGpa, setTargetGpa] = useState(String(settings.targetGpa));

  // GPA grading rules configuration
  const [gpaConfig, setGpaConfig] = useState<GpaGradingConfig>(() => {
    return settings.gpaConfig || getDefaultGpaConfig(settings.gradingScale);
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Backup & Restore states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState<UniPlannerBackupData | null>(null);
  const [pendingBackupPreview, setPendingBackupPreview] = useState<BackupPreviewInfo | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Switch scale preset and load corresponding default rules
  const handleScalePresetChange = (newScale: '4.0' | '4.0_ugc' | '4.33' | '5.0' | 'percentage') => {
    setGradingScale(newScale);
    const defaults = getDefaultGpaConfig(newScale);
    setGpaConfig(defaults);
    setValidationErrors([]);
  };

  const handleResetToPresetDefaults = () => {
    const defaults = getDefaultGpaConfig(gradingScale);
    setGpaConfig(defaults);
    setValidationErrors([]);
  };

  const handleAddRule = () => {
    const newRule: GpaScaleRule = {
      grade: '',
      gradePoint: 0,
      minPercentage: undefined,
    };
    setGpaConfig((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  const handleRemoveRule = (index: number) => {
    if (gpaConfig.rules.length <= 1) return;
    setGpaConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateRule = (index: number, field: keyof GpaScaleRule, value: string) => {
    setGpaConfig((prev) => {
      const updated = [...prev.rules];
      const target = { ...updated[index] };

      if (field === 'grade') {
        target.grade = value;
      } else if (field === 'gradePoint') {
        const num = parseFloat(value);
        target.gradePoint = isNaN(num) ? 0 : Math.max(0, num);
      } else if (field === 'minPercentage') {
        if (!value.trim()) {
          target.minPercentage = undefined;
        } else {
          const num = parseFloat(value);
          target.minPercentage = isNaN(num) ? undefined : Math.max(0, Math.min(100, num));
        }
      }

      updated[index] = target;
      return { ...prev, rules: updated };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate GPA config
    const validation = validateGpaConfig(gpaConfig);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    updateSettings({
      studentName: studentName.trim(),
      universityName: universityName.trim(),
      degreeProgram: degreeProgram.trim(),
      gradingScale: gradingScale as '4.0' | '4.0_ugc' | '4.33' | '5.0' | 'percentage',
      currentTerm: currentTerm.trim() || 'Fall 2026',
      targetGpa: parseFloat(targetGpa) || 3.8,
      language,
      gpaConfig,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    resetToEmptyData();
    setStudentName('');
    setUniversityName('');
    setDegreeProgram('');
    setCurrentTerm('Fall 2026');
    setTargetGpa('3.8');
    setGradingScale('4.0_ugc');
    setGpaConfig(getDefaultGpaConfig('4.0_ugc'));
    setShowResetConfirm(false);
    setResetConfirmText('');
    setBackupNotice('All courses, assessments, and grade records have been reset successfully.');
    setImportErrors([]);
    setTimeout(() => setBackupNotice(null), 5000);
  };


  // Export backup download trigger
  const handleExportBackup = () => {
    const timestamp = triggerExportBackup();
    setBackupNotice(`Backup successfully exported and downloaded at ${formatBackupDate(timestamp)}.`);
    setImportErrors([]);
    setTimeout(() => setBackupNotice(null), 5000);
  };

  // Handle uploaded JSON file selection
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrors([]);
    setBackupNotice(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setImportErrors(['The uploaded file appears to be empty.']);
        return;
      }

      const result = validateBackupJson(content);
      if (!result.isValid) {
        setImportErrors(result.errors);
        // Clear file input so user can re-try
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setPendingBackupData(result.data!);
        setPendingBackupPreview(result.preview!);
        setIsRestoreModalOpen(true);
        setImportErrors([]);
      }
    };

    reader.onerror = () => {
      setImportErrors(['Failed to read the selected file from disk.']);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  // Confirm atomic restore
  const handleConfirmRestore = (backupData: UniPlannerBackupData) => {
    const success = restoreFromBackup(backupData);
    if (success) {
      // Sync local component state with restored settings
      setStudentName(backupData.settings.studentName || '');
      setUniversityName(backupData.settings.universityName || '');
      setDegreeProgram(backupData.settings.degreeProgram || '');
      setGradingScale(backupData.settings.gradingScale || '4.0');
      setCurrentTerm(backupData.settings.currentTerm || 'Fall 2026');
      setTargetGpa(String(backupData.settings.targetGpa || 3.8));
      if (backupData.settings.gpaConfig) {
        setGpaConfig(backupData.settings.gpaConfig);
      }

      setBackupNotice(
        `Backup successfully restored! Active workspace now contains ${backupData.courses.length} courses and ${backupData.assessments.length} assessments.`
      );
      setImportErrors([]);
    } else {
      setImportErrors(['Atomic restoration failed. Your current data was left unchanged.']);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="view-header" style={{ marginBottom: '22px' }}>
        <div className="view-title-group">
          <h2>{t('settings.title')}</h2>
          <p>{t('settings.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Language Selection Card */}
        <div className="settings-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Globe size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {t('settings.languageSection')}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                {t('settings.languageSubtitle')}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '14px',
              marginTop: '16px',
            }}
          >
            {/* English Card */}
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${language === 'en' ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: language === 'en' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${language === 'en' ? 'var(--primary)' : '#94a3b8'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              >
                {language === 'en' && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t('settings.englishCardTitle')}
                  </span>
                  {language === 'en' && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {t('settings.englishCardDesc')}
                </p>
              </div>
            </button>

            {/* Bangla Card */}
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${language === 'bn' ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: language === 'bn' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${language === 'bn' ? 'var(--primary)' : '#94a3b8'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              >
                {language === 'bn' && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {t('settings.bengaliCardTitle')}
                  </span>
                  {language === 'bn' && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                      }}
                    >
                      সক্রিয়
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.4 }}>
                  {t('settings.bengaliCardDesc')}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Student Profile Card */}
        <div className="settings-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {t('settings.profileSection')}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                {t('settings.profileSubtitle')}
              </p>
            </div>
          </div>

          {/* Live Student Identity Card Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '20px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '19px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.22)',
              }}
            >
              {getInitials(studentName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {studentName.trim() || 'Student Account'}
                </strong>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--accent)',
                  }}
                >
                  {currentTerm.trim() || 'Fall 2026'}
                </span>
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>{universityName.trim() || 'Institution not specified'}</span>
                {degreeProgram.trim() && <span>• {degreeProgram.trim()}</span>}
              </div>
            </div>
          </div>

          {/* Symmetrical 2-Column Balanced Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="student-name">{t('settings.studentName')}</label>
              <input
                id="student-name"
                type="text"
                className="form-input"
                placeholder={t('settings.studentNamePlaceholder')}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="current-term-input">{t('settings.term')}</label>
              <input
                id="current-term-input"
                type="text"
                className="form-input"
                placeholder={t('settings.termPlaceholder')}
                value={currentTerm}
                onChange={(e) => setCurrentTerm(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="uni-name">{t('settings.university')}</label>
              <input
                id="uni-name"
                type="text"
                className="form-input"
                placeholder={t('settings.universityPlaceholder')}
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="degree-prog">{t('settings.degree')}</label>
              <input
                id="degree-prog"
                type="text"
                className="form-input"
                placeholder={t('settings.degreePlaceholder')}
                value={degreeProgram}
                onChange={(e) => setDegreeProgram(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Academic Grading Scale & GPA Rules */}
        <div className="settings-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#faf5ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                University GPA Grading Rules & Scale
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                Configure the grading rules used by your university. Customize scale limits, letter grades, and thresholds.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px', marginTop: '16px' }}>
            {/* Row 1: Scale System (3 Balanced Columns) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="grading-scale-select">Standard Preset Scale</label>
                <select
                  id="grading-scale-select"
                  className="form-select"
                  value={gradingScale}
                  onChange={(e) => handleScalePresetChange(e.target.value as any)}
                >
                  <option value="4.0_ugc">4.0 Scale (UGC Bangladesh / Green University — 80% A+ 4.00, 75% A 3.75, 70% A- 3.50)</option>
                  <option value="4.0">4.0 Scale (US / Global Standard — A=4.0, B=3.0, C=2.0)</option>
                  <option value="4.33">4.33 Scale (A+=4.33, A=4.0, A-=3.7)</option>
                  <option value="5.0">5.0 Scale (Singapore / Nordic / Honors systems)</option>
                  <option value="percentage">100-Point Percentage System</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scale-max-input">Scale Maximum GPA</label>
                <input
                  id="scale-max-input"
                  type="number"
                  step="0.01"
                  min="1"
                  max="100"
                  className="form-input"
                  value={gpaConfig.scaleMax}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setGpaConfig((prev) => ({
                      ...prev,
                      scaleMax: isNaN(val) ? 4.0 : Math.max(0.1, val),
                    }));
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="target-gpa-input">Target GPA Goal</label>
                <input
                  id="target-gpa-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={gpaConfig.scaleMax}
                  className="form-input"
                  placeholder="3.80"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Passing Standards (2 Symmetrical Columns in Clean Sub-Card) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
                padding: '16px 18px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="min-passing-grade-input">
                  Minimum Passing Grade (Optional)
                </label>
                <input
                  id="min-passing-grade-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. D or Pass"
                  value={gpaConfig.minPassingGrade || ''}
                  onChange={(e) =>
                    setGpaConfig((prev) => ({
                      ...prev,
                      minPassingGrade: e.target.value.trim() || undefined,
                    }))
                  }
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="min-passing-gp-input">
                  Minimum Passing Grade Point (Optional)
                </label>
                <input
                  id="min-passing-gp-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={gpaConfig.scaleMax}
                  className="form-input"
                  placeholder="e.g. 1.00"
                  value={gpaConfig.minPassingGradePoint !== undefined ? String(gpaConfig.minPassingGradePoint) : ''}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setGpaConfig((prev) => ({
                      ...prev,
                      minPassingGradePoint: val ? parseFloat(val) : undefined,
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          {/* Validation Errors Alert */}
          {validationErrors.length > 0 && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={16} />
                <span>Grading Rules Validation Notice:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Configurable Rules Table */}
          <div style={{ marginTop: '20px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--text-main)', display: 'block' }}>
                  Grade Scale Points & Percentage Thresholds
                </strong>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                  {gpaConfig.rules.length} configured letter grade thresholds
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '12.5px', padding: '6px 12px', minHeight: '34px' }}
                  onClick={handleResetToPresetDefaults}
                  title="Restore standard rules for the selected scale"
                >
                  <RotateCcw size={13} />
                  <span>Restore Standard Defaults</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '12.5px', padding: '6px 12px', minHeight: '34px' }}
                  onClick={handleAddRule}
                >
                  <Plus size={13} />
                  <span>Add Grade Level</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xs)' }}>
              <table style={{ width: '100%', minWidth: '580px', borderCollapse: 'collapse', fontSize: '14.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '13px 16px', fontWeight: 700 }}>Letter Grade</th>
                    <th style={{ padding: '13px 16px', fontWeight: 700 }}>Grade Point (Max: {gpaConfig.scaleMax})</th>
                    <th style={{ padding: '13px 16px', fontWeight: 700 }}>Min. Marks / Percentage (%)</th>
                    <th style={{ padding: '13px 16px', width: '64px', textAlign: 'center', fontWeight: 700 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {gpaConfig.rules.map((rule, index) => {
                    const pillStyle = getGradePillStyle(rule.grade);
                    return (
                      <tr
                        key={index}
                        style={{
                          borderBottom: index === gpaConfig.rules.length - 1 ? 'none' : '1px solid var(--border)',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: pillStyle.bg,
                                color: pillStyle.color,
                                border: `1px solid ${pillStyle.border}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {rule.grade || '—'}
                            </span>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: '8px 12px', fontSize: '14.5px', fontWeight: 800, minHeight: '40px' }}
                              placeholder="e.g. A"
                              value={rule.grade}
                              onChange={(e) => handleUpdateRule(index, 'grade', e.target.value)}
                            />
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={gpaConfig.scaleMax}
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '14.5px', minHeight: '40px' }}
                            value={rule.gradePoint}
                            onChange={(e) => handleUpdateRule(index, 'gradePoint', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '14.5px', minHeight: '40px' }}
                            placeholder="e.g. 80"
                            value={rule.minPercentage !== undefined ? rule.minPercentage : ''}
                            onChange={(e) => handleUpdateRule(index, 'minPercentage', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            style={{
                              color: 'var(--danger)',
                              padding: '8px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: gpaConfig.rules.length > 1 ? 'pointer' : 'not-allowed',
                              opacity: gpaConfig.rules.length > 1 ? 1 : 0.4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.15s ease',
                              minWidth: '36px',
                              minHeight: '36px',
                            }}
                            disabled={gpaConfig.rules.length <= 1}
                            onClick={() => handleRemoveRule(index)}
                            aria-label={`Remove grade rule ${rule.grade || index + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '32px' }}>
          <button type="submit" className="btn-primary" style={{ minHeight: '44px', padding: '10px 24px', fontWeight: 700 }}>
            {isSaved ? <Check size={16} /> : null}
            <span>{isSaved ? (language === 'bn' ? 'সংরক্ষিত হয়েছে!' : 'Settings Saved!') : t('settings.saveSettings')}</span>
          </button>
          {isSaved && (
            <span style={{ fontSize: '13.5px', color: 'var(--success)', fontWeight: 700 }}>
              {language === 'bn' ? 'সফলভাবে আপডেট করা হয়েছে' : 'Updated successfully'}
            </span>
          )}
        </div>
      </form>

      {/* Backup & Device Storage */}
      <div className="settings-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Backup & Device Storage
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                Your courses and marks are stored privately on this device. You can download or restore backups anytime.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              className={`network-status-pill ${isOnline ? 'online' : 'offline'}`}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{isOnline ? 'Online • Auto Saved' : 'Offline Mode'}</span>
            </div>

            {isInstalled ? (
              <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Check size={13} />
                <span>Installed</span>
              </span>
            ) : (
              <button
                type="button"
                className="pwa-install-btn"
                onClick={async () => {
                  if (isInstallable) {
                    const outcome = await promptInstall();
                    if (outcome === 'unsupported') {
                      openInstallModal();
                    }
                  } else {
                    openInstallModal();
                  }
                }}
                title="Install UniPlanner app on this device"
              >
                <Smartphone size={13} />
                <span>Install App</span>
              </button>
            )}
          </div>
        </div>

        <div className="settings-group-desc" style={{ marginBottom: '16px' }}>
          Your courses and marks are stored privately on this device. You can download a secure backup file or restore past data anytime.
        </div>

        {/* Update Notice if available */}
        {hasUpdate && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--info)', fontWeight: 600 }}>
              A new app update is ready!
            </span>
            <button
              type="button"
              className="pwa-update-btn"
              onClick={applyUpdate}
            >
              <RefreshCw size={13} />
              <span>Refresh & Update</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {backupNotice && (
          <div
            role="status"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)',
              fontSize: '13.5px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            <span>{backupNotice}</span>
          </div>
        )}

        {/* Import Validation Errors Alert */}
        {importErrors.length > 0 && (
          <div
            role="alert"
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '13.5px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
              <AlertTriangle size={16} />
              <span>Backup File Rejected:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {importErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Export & Restore Action Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Export Card */}
          <div
            style={{
              padding: '18px 20px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Download size={18} color="var(--accent)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Export Backup</strong>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                Download a secure backup of all your courses, marks, and settings to this device.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', minHeight: '42px', fontWeight: 600 }}
                onClick={handleExportBackup}
              >
                <Download size={16} />
                <span>Download Backup</span>
              </button>

              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px', textAlign: 'center' }}>
                {lastBackupExportTime ? (
                  <span>Last exported: <strong>{formatBackupDate(lastBackupExportTime)}</strong></span>
                ) : (
                  <span>No export created yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Restore Card */}
          <div
            style={{
              padding: '18px 20px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Upload size={18} color="var(--primary)" />
                <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>Restore from Backup</strong>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                Restore your academic records from an existing backup file. Previews courses and checks data before applying.
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', minHeight: '42px', fontWeight: 600 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>Select Backup File</span>
              </button>

              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px', textAlign: 'center' }}>
                Previews data before replacing
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone / Reset State */}
      <div className="settings-group" style={{ borderColor: '#fecaca', backgroundColor: '#fffafa' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--danger)' }}>
              Data Privacy & Clean Slate
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
              UniPlanner stores all records locally on your device for absolute privacy. You can reset everything back to zero records at any time.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            setShowResetConfirm(true);
            setResetConfirmText('');
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ShieldAlert size={16} />
          <span>Reset All Data to Empty State</span>
        </button>
      </div>

      {/* Danger Zone: GitHub-Style Type-to-Confirm Security Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => {
          setShowResetConfirm(false);
          setResetConfirmText('');
        }}
        title="Reset All Data"
        maxWidth="500px"
      >
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '4px solid #fef2f2',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h4
            style={{
              fontSize: '17px',
              fontWeight: 800,
              textAlign: 'center',
              color: 'var(--text-main)',
              marginBottom: '8px',
            }}
          >
            Reset All Academic Data?
          </h4>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            This action cannot be undone. All your enrolled courses, assessments, and grade records on this device will be cleared to a fresh slate.
          </p>

          <div className="form-group">
            <label
              htmlFor="wipe-confirmation-input"
              className="form-label"
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}
            >
              To confirm reset, type <strong style={{ color: 'var(--danger)', letterSpacing: '0.5px' }}>RESET</strong> below:
            </label>
            <input
              id="wipe-confirmation-input"
              type="text"
              className="form-input"
              style={{
                borderColor: resetConfirmText.trim() === 'RESET' ? 'var(--danger)' : undefined,
                fontWeight: 700,
                letterSpacing: '1px',
              }}
              placeholder="Type RESET in capital letters"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowResetConfirm(false);
              setResetConfirmText('');
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            disabled={resetConfirmText.trim() !== 'RESET'}
            style={{
              opacity: resetConfirmText.trim() === 'RESET' ? 1 : 0.45,
              cursor: resetConfirmText.trim() === 'RESET' ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleReset}
          >
            <Trash2 size={15} />
            <span>Permanently Wipe All Data</span>
          </button>
        </div>
      </Modal>

      {/* Restore Confirmation & Preview Modal */}
      <RestoreBackupModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        backupData={pendingBackupData}
        preview={pendingBackupPreview}
        onConfirmRestore={handleConfirmRestore}
      />
    </div>
  );
};
