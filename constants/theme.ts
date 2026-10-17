import { Platform } from 'react-native';

const tintColorLight = '#0F8A6C';
const tintColorDark = '#7AE7C0';

export const Colors = {
  light: {
    text: '#172126',
    background: '#F4F7F4',
    surface: '#FCFDFC',
    surfaceAlt: '#E7EFEA',
    card: '#FFFFFF',
    tint: tintColorLight,
    accent: '#125F53',
    muted: '#667874',
    border: '#D6E1DC',
    icon: '#8B989B',
    success: '#147D64',
    warning: '#A56A0D',
    danger: '#B64545',
    bubbleUser: '#135C4E',
    onBubbleUser: '#F5FFFB',
    bubbleAssistant: '#EEF4F1',
    onBubbleAssistant: '#182320',
    tabBackground: '#F9FBFA',
    tabIconDefault: '#8B989B',
    tabIconSelected: tintColorLight,
  },
  dark: {
    // True black canvas. Surfaces step up in small neutral increments so
    // elevation stays readable without the old green cast.
    text: '#FFFFFF',
    background: '#000000',
    surface: '#101010',
    surfaceAlt: '#151515',
    card: '#101010',
    tint: tintColorDark,
    accent: '#58D4AB',
    muted: '#9E9E9E',
    border: '#242424',
    icon: '#8C8C8C',
    success: '#63D9B1',
    warning: '#E6B35A',
    danger: '#F08A8A',
    // Green is an accent only: user turns, active states, and selected tabs.
    bubbleUser: '#1C6B5C',
    onBubbleUser: '#FFFFFF',
    bubbleAssistant: '#101010',
    onBubbleAssistant: '#FFFFFF',
    tabBackground: '#000000',
    tabIconDefault: '#8C8C8C',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Avenir Next',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
    display: 'Avenir Next',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    display: 'normal',
  },
  web: {
    sans: "'Avenir Next', 'Segoe UI', 'Trebuchet MS', sans-serif",
    serif: "Charter, 'Iowan Old Style', Georgia, serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    display: "'Avenir Next', 'Segoe UI', 'Trebuchet MS', sans-serif",
  },
});
