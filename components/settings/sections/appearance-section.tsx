import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HelperText } from 'react-native-paper';

import type { NativeSelectOption } from '@/components/ui/native-select';
import { formatUiScale, normalizeUiScale, UI_SCALE_STEPS } from '@/lib/ui-scale';
import { normalizeThemePreference, type ChatPreferences, type ThemePreference } from '@/providers/opencode-preferences';
import { SettingSelectField, type Palette } from './setting-rows';

// Appearance is a preference-only surface: theme and UI scale are stored on the
// same chat preferences object as language, so switching either one applies on
// the next render without touching native settings.
export function AppearanceSection({
  chatPreferences,
  palette,
  updateChatPreferences,
}: {
  chatPreferences: ChatPreferences;
  palette: Palette;
  updateChatPreferences: (patch: Partial<ChatPreferences>) => void;
}) {
  const { t } = useTranslation();

  const themeOptions: NativeSelectOption<ThemePreference>[] = [
    { label: t('common:labels.systemDefault'), value: 'system' },
    { label: t('settings:appearance.theme.light'), value: 'light' },
    { label: t('settings:appearance.theme.dark'), value: 'dark' },
  ];
  const theme = normalizeThemePreference(chatPreferences.theme) ?? 'system';

  const scale = normalizeUiScale(chatPreferences.uiScale);
  // The select is string-valued, so steps travel as their numeric value and are
  // parsed back through `normalizeUiScale` before persisting.
  const scaleOptions: NativeSelectOption<string>[] = UI_SCALE_STEPS.map((step) => ({
    label: formatUiScale(step),
    value: String(step),
  }));
  const scaleValueLabel = formatUiScale(scale);

  return (
    <View testID="settings-appearance-section" style={styles.section}>
      <SettingSelectField
        label={t('settings:appearance.theme.title')}
        onValueChange={(value) => updateChatPreferences({ theme: value })}
        options={themeOptions}
        palette={palette}
        selectedValue={theme}
        valueLabel={themeOptions.find((option) => option.value === theme)?.label ?? t('common:labels.systemDefault')}
      />
      <HelperText type="info">{t('settings:appearance.theme.description')}</HelperText>
      <SettingSelectField
        label={t('settings:appearance.uiScale.title')}
        onValueChange={(value) => updateChatPreferences({ uiScale: normalizeUiScale(Number.parseFloat(value)) })}
        options={scaleOptions}
        palette={palette}
        selectedValue={String(scale)}
        valueLabel={scaleValueLabel}
      />
      <HelperText type="info">{t('settings:appearance.uiScale.description')}</HelperText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14, paddingBottom: 8 },
});
