import { TextStyle } from './types';
import { BorderRadiusCorners } from './borderRadius';
export type Engine = 'svg' | 'css' | 'canvas';
export type TextAlign = 'start' | 'center' | 'end';
export type TextBaseline = 'top' | 'center' | 'bottom';
export interface EngineStyleAttributesMapping {
    textAlign: Record<TextAlign, string>;
    textBaseline: Record<TextBaseline, string>;
}
export declare const svgStyleAttributesMapping: EngineStyleAttributesMapping;
export declare const cssStyleAttributesMapping: EngineStyleAttributesMapping;
export declare const canvasStyleAttributesMapping: EngineStyleAttributesMapping;
export declare const styleAttributesMapping: Record<Engine, EngineStyleAttributesMapping>;
export declare const convertStyleAttribute: <K extends keyof EngineStyleAttributesMapping>(engine: Engine, attr: K, value: keyof EngineStyleAttributesMapping[K]) => EngineStyleAttributesMapping[K][keyof EngineStyleAttributesMapping[K]];
export declare const sanitizeSvgTextStyle: (style: TextStyle) => Omit<TextStyle, "outlineWidth" | "outlineColor" | "outlineOpacity">;
export declare const sanitizeHtmlTextStyle: (style: TextStyle) => Omit<TextStyle, "outlineWidth" | "outlineColor" | "outlineOpacity" | "fill">;
/**
 * Render a CSS-compatible border-radius string (e.g. "4px 4px 0 0").
 */
export declare const borderRadiusToCss: ({ topLeft, topRight, bottomRight, bottomLeft, }: BorderRadiusCorners) => string;
//# sourceMappingURL=bridge.d.ts.map