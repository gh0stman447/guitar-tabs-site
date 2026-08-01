import {
  TAB_TECHNIQUES,
  TAB_TUNINGS,
  type TabCharacteristics,
  type TabTechnique,
  type TabTuning,
} from '@/types';

export const DEFAULT_TAB_CHARACTERISTICS: TabCharacteristics = {
  techniques: [],
  tuning: 'standard',
  capo: 0,
};

export function normalizeTabCharacteristics(value: unknown): TabCharacteristics {
  if (!value || typeof value !== 'object') return DEFAULT_TAB_CHARACTERISTICS;

  const raw = value as Record<string, unknown>;
  const techniques = Array.isArray(raw.techniques)
    ? [
        ...new Set(
          raw.techniques.filter((item): item is TabTechnique =>
            TAB_TECHNIQUES.includes(item as TabTechnique),
          ),
        ),
      ]
    : [];
  const tuning = TAB_TUNINGS.includes(raw.tuning as TabTuning)
    ? (raw.tuning as TabTuning)
    : 'standard';
  const capoValue = Number(raw.capo);
  const capo = Number.isInteger(capoValue) && capoValue >= 0 && capoValue <= 12 ? capoValue : 0;
  const customTuning = typeof raw.customTuning === 'string' ? raw.customTuning.trim() : '';

  return {
    techniques,
    tuning,
    ...(tuning === 'custom' && customTuning ? { customTuning } : {}),
    capo,
  };
}

export function validateTabCharacteristics(value: unknown): TabCharacteristics | null {
  const normalized = normalizeTabCharacteristics(value);
  if (normalized.tuning === 'custom' && !normalized.customTuning) return null;
  return normalized;
}

const LABELS = {
  ru: {
    techniques: {
      barre: 'Баррэ',
      percussion: 'Перкуссия',
      harmonics: 'Флажолеты',
      tapping: 'Тэппинг',
    },
    tunings: {
      standard: 'Стандартный строй',
      drop_d: 'Drop D',
      nonstandard: 'Нестандартный строй',
      custom: 'Свой строй',
    },
    noCapo: 'Без каподастра',
    capo: (fret: number) => `Каподастр: ${fret} лад`,
  },
  en: {
    techniques: {
      barre: 'Barre',
      percussion: 'Percussion',
      harmonics: 'Harmonics',
      tapping: 'Tapping',
    },
    tunings: {
      standard: 'Standard tuning',
      drop_d: 'Drop D',
      nonstandard: 'Alternate tuning',
      custom: 'Custom tuning',
    },
    noCapo: 'No capo',
    capo: (fret: number) => `Capo: fret ${fret}`,
  },
} as const;

export function getTabCharacteristicLabels(
  value: unknown,
  locale: string,
): Array<{ key: string; label: string; kind: 'technique' | 'tuning' | 'capo' }> {
  const characteristics = normalizeTabCharacteristics(value);
  const copy = locale === 'en' ? LABELS.en : LABELS.ru;
  const tuningLabel =
    characteristics.tuning === 'custom' && characteristics.customTuning
      ? characteristics.customTuning
      : copy.tunings[characteristics.tuning];

  return [
    ...characteristics.techniques.map((technique) => ({
      key: technique,
      label: copy.techniques[technique],
      kind: 'technique' as const,
    })),
    { key: 'tuning', label: tuningLabel, kind: 'tuning' as const },
    {
      key: 'capo',
      label: characteristics.capo === 0 ? copy.noCapo : copy.capo(characteristics.capo),
      kind: 'capo' as const,
    },
  ];
}
