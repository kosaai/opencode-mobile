import { useMemo } from 'react';

import { createScale, normalizeUiScale, type Scale } from '@/lib/ui-scale';
import { usePreferences } from '@/providers/opencode-contexts';

// Single access point for the UI scale factor. Components apply it to the same
// places `slimInterface` already touches (text, control heights, spacing), so
// every surface moves together and no screen drifts on its own.
export function useUiScale(): Scale {
  const { chatPreferences } = usePreferences();
  const factor = normalizeUiScale(chatPreferences.uiScale);
  return useMemo(() => createScale(factor), [factor]);
}
