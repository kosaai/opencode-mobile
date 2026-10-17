import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { usePreferences } from '@/providers/opencode-contexts';

const subscribe = () => () => undefined;

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * `useSyncExternalStore` gives the server snapshot ('light') and the hydrated client snapshot
 * without a state-setting effect.
 *
 * An explicit Light/Dark preference is honoured on the server too, so the
 * chosen theme is what renders on first paint.
 */
export function useColorScheme(): 'light' | 'dark' {
  const { chatPreferences } = usePreferences();
  const colorScheme = useRNColorScheme();
  const hasHydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const preference = chatPreferences.theme ?? 'system';

  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }

  if (hasHydrated) {
    return colorScheme === 'dark' ? 'dark' : 'light';
  }

  return 'light';
}
