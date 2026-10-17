import { useColorScheme as useRNColorScheme } from 'react-native';

import { usePreferences } from '@/providers/opencode-contexts';

// Resolves the active color scheme: an explicit Light/Dark preference wins,
// otherwise the OS setting applies. Reading it through the provider keeps one
// source of truth, so every screen flips together when the preference changes.
export function useColorScheme(): 'light' | 'dark' {
  const { chatPreferences } = usePreferences();
  const system = useRNColorScheme();
  const preference = chatPreferences.theme ?? 'system';

  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }

  return system === 'dark' ? 'dark' : 'light';
}
