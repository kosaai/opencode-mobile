import assert from 'node:assert/strict';
import { loadTs } from './helpers/runtime.mjs';

// `opencode-preferences` imports the pure UI scale helpers, so the sandbox
// maps the `@/lib/ui-scale` alias the same way other tests map aliases.
const uiScale = await loadTs('lib/ui-scale.ts');
const preferences = await loadTs('providers/opencode-preferences.ts', { '@/lib/ui-scale': uiScale });
const { normalizeTranscriptFontSize, defaultChatPreferences } = preferences;

assert.equal(normalizeTranscriptFontSize(16), 16);
assert.equal(normalizeTranscriptFontSize(12.4), 12);
assert.equal(normalizeTranscriptFontSize(11), 12);
assert.equal(normalizeTranscriptFontSize(25), 24);
assert.equal(normalizeTranscriptFontSize(Number.NaN), 16);
assert.equal(normalizeTranscriptFontSize(undefined), 16);

assert.equal(defaultChatPreferences.flatTranscript, false);
assert.equal(defaultChatPreferences.slimInterface, false);
assert.equal(defaultChatPreferences.uiScale, 1);
assert.equal(uiScale.normalizeUiScale(0.5), 0.8);
assert.equal(uiScale.normalizeUiScale(2), 1.2);
assert.equal(uiScale.normalizeUiScale(1.1), 1.1);
assert.equal(uiScale.formatUiScale(0.9), '90%');
assert.equal(preferences.normalizeThemePreference('dark'), 'dark');
assert.equal(preferences.normalizeThemePreference('neon'), undefined);

console.log('chat appearance tests passed');
