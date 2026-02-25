export const Colors = {
  primary:          '#1A56FF',
  primaryLight:     '#E8EEFF',
  primaryDark:      '#1240CC',
  success:          '#16A34A',
  successLight:     '#DCFCE7',
  warning:          '#D97706',
  warningLight:     '#FEF3C7',
  error:            '#DC2626',
  errorLight:       '#FEE2E2',
  info:             '#0891B2',
  infoLight:        '#CFFAFE',
  statusProcessing: '#3B82F6',
  statusReady:      '#16A34A',
  statusFailed:     '#DC2626',
  white:            '#FFFFFF',
  black:            '#0A0A0A',
  gray50:           '#F9FAFB',
  gray100:          '#F3F4F6',
  gray200:          '#E5E7EB',
  gray300:          '#D1D5DB',
  gray400:          '#9CA3AF',
  gray500:          '#6B7280',
  gray600:          '#4B5563',
  gray700:          '#374151',
  gray800:          '#1F2937',
  gray900:          '#111827',
  overlay:          'rgba(0,0,0,0.5)',
  background:       '#F9FAFB',
  surface:          '#FFFFFF',
} as const;

export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Typography = {
  size: {
    xs:    11,
    sm:    13,
    base:  15,
    md:    16,
    lg:    18,
    xl:    20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;

export const BorderRadius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
} as const;

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,  elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8,  elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8 },
} as const;

export const Layout = {
  screenPaddingH: 16,
  screenPaddingV: 20,
  headerHeight:   56,
  fabSize:        56,
} as const;
