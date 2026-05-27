import { atom } from 'jotai';

/**
 * Granular Jotai Atoms
 * Provides isolated widget-level nodes to maximize render efficiency
 * and prevent redundant renders on high-frequency UI elements.
 */

// 1. Core Parameter Atoms
export const widgetTemperatureAtom = atom<number>(27);
export const widgetAqiAtom = atom<number>(68);
export const widgetRainProbabilityAtom = atom<number>(10);
export const widgetCityNameAtom = atom<string>('Chennai');
export const widgetWeatherConditionAtom = atom<string>('Clear Sky');

// 2. Widget Customizer Interface Atoms
export const widgetTransparentModeAtom = atom<boolean>(true);
export const widgetShowAqiGaugeAtom = atom<boolean>(true);
export const widgetShowRainTrendAtom = atom<boolean>(true);
export const widgetBorderGlowAtom = atom<string>('#A855F7');

// 3. Low-Latency Parallax Offsets Atoms
export const widgetParallaxXAtom = atom<number>(0);
export const widgetParallaxYAtom = atom<number>(0);
