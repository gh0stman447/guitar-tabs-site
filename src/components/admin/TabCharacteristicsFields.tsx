'use client';

import { Field, inputCls } from '@/components/admin/AdminFormFields';
import { TAB_TECHNIQUES, type TabCharacteristics, type TabTechnique } from '@/types';

const TECHNIQUE_LABELS: Record<TabTechnique, string> = {
  barre: 'Баррэ',
  percussion: 'Перкуссия',
  harmonics: 'Флажолеты',
  tapping: 'Тэппинг',
};

export function TabCharacteristicsFields({
  value,
  onChange,
}: {
  value: TabCharacteristics;
  onChange: (value: TabCharacteristics) => void;
}) {
  function toggleTechnique(technique: TabTechnique) {
    const techniques = value.techniques.includes(technique)
      ? value.techniques.filter((item) => item !== technique)
      : [...value.techniques, technique];
    onChange({ ...value, techniques });
  }

  return (
    <div className='flex flex-col gap-5 rounded-xl border border-border/70 bg-muted/20 p-4'>
      <div>
        <p className='text-sm font-semibold'>Особенности исполнения</p>
        <p className='mt-1 text-xs text-muted-foreground'>Можно выбрать несколько техник</p>
      </div>

      <Field label='Техники'>
        <div className='flex flex-wrap gap-2'>
          {TAB_TECHNIQUES.map((technique) => {
            const selected = value.techniques.includes(technique);
            return (
              <button
                key={technique}
                type='button'
                aria-pressed={selected}
                onClick={() => toggleTechnique(technique)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
              >
                {TECHNIQUE_LABELS[technique]}
              </button>
            );
          })}
        </div>
      </Field>

      <div className='grid gap-4 sm:grid-cols-2'>
        <Field label='Строй'>
          <select
            value={value.tuning}
            onChange={(event) =>
              onChange({
                ...value,
                tuning: event.target.value as TabCharacteristics['tuning'],
                customTuning: event.target.value === 'custom' ? value.customTuning : undefined,
              })
            }
            className={inputCls}
          >
            <option value='standard'>Стандартный строй</option>
            <option value='drop_d'>Drop D</option>
            <option value='nonstandard'>Нестандартный строй</option>
            <option value='custom'>Свой вариант</option>
          </select>
        </Field>

        <Field label='Каподастр'>
          <select
            value={value.capo}
            onChange={(event) => onChange({ ...value, capo: Number(event.target.value) })}
            className={inputCls}
          >
            <option value={0}>Без каподастра</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((fret) => (
              <option key={fret} value={fret}>
                {fret} лад
              </option>
            ))}
          </select>
        </Field>
      </div>

      {value.tuning === 'custom' && (
        <Field label='Свой вариант строя'>
          <input
            required
            value={value.customTuning ?? ''}
            onChange={(event) => onChange({ ...value, customTuning: event.target.value })}
            placeholder='Например: D A D G A D'
            className={inputCls}
          />
        </Field>
      )}
    </div>
  );
}
