// Central UI scale helpers.
//
// One factor drives text, control heights, spacing, icon sizes, and card
// padding so the interface grows and shrinks together. Values are applied at
// the call site (the same way `slimInterface` already is) instead of a global
// `transform: scale`, which would break hit targets and layout measurement.

export const UI_SCALE_MIN = 0.8;
export const UI_SCALE_MAX = 1.2;
export const DEFAULT_UI_SCALE = 1;

// The only accepted scale values, exposed to Settings as percentages.
export const UI_SCALE_STEPS = [0.8, 0.9, 1, 1.1, 1.2] as const;

export function normalizeUiScale(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_UI_SCALE;
  }
  return UI_SCALE_STEPS.reduce(
    (closest, step) => (Math.abs(step - value) < Math.abs(closest - value) ? step : closest),
    UI_SCALE_MIN as number,
  );
}

export function formatUiScale(value: number): string {
  return `${Math.round(normalizeUiScale(value) * 100)}%`;
}

// Layout dimensions snap to half pixels: crisp enough for borders and padding
// while still letting 90% and 110% differ visibly from 100%.
export function scaleSize(value: number, factor: number): number {
  const scaled = value * factor;
  return Math.round(scaled * 2) / 2;
}

// Text snaps to whole pixels so glyphs stay sharp at every step.
export function scaleFont(value: number, factor: number): number {
  return Math.max(1, Math.round(value * factor));
}

export type Scale = {
  factor: number;
  size: (value: number) => number;
  font: (value: number) => number;
};

export function createScale(factor: number): Scale {
  const safe = normalizeUiScale(factor);
  return {
    factor: safe,
    size: (value: number) => scaleSize(value, safe),
    font: (value: number) => scaleFont(value, safe),
  };
}

export const identityScale: Scale = createScale(DEFAULT_UI_SCALE);
