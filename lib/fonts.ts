import { Platform, TextStyle } from 'react-native';

// San Francisco font family configuration for iOS
// On iOS, 'System' automatically uses SF Pro
// This file provides consistent typography across the app

export const fontFamily = {
  // Primary system font (SF Pro on iOS)
  regular: Platform.select({
    ios: 'System',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    default: 'System',
  }),
};

// Font weights for San Francisco
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  heavy: '800' as TextStyle['fontWeight'],
};

// Typography scale (Apple HIG inspired)
export const typography = {
  // Large Title - 34pt
  largeTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: 0.37,
  } as TextStyle,

  // Title 1 - 28pt
  title1: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.36,
  } as TextStyle,

  // Title 2 - 22pt
  title2: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.35,
  } as TextStyle,

  // Title 3 - 20pt
  title3: {
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: 0.38,
  } as TextStyle,

  // Headline - 17pt semibold
  headline: {
    fontFamily: fontFamily.semibold,
    fontWeight: fontWeight.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
  } as TextStyle,

  // Body - 17pt
  body: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
  } as TextStyle,

  // Callout - 16pt
  callout: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
  } as TextStyle,

  // Subheadline - 15pt
  subheadline: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
  } as TextStyle,

  // Footnote - 13pt
  footnote: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.08,
  } as TextStyle,

  // Caption 1 - 12pt
  caption1: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  } as TextStyle,

  // Caption 2 - 11pt
  caption2: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.07,
  } as TextStyle,
};

export default typography;
