export interface BorderRadiusCorners<V = number> {
    topLeft: V;
    topRight: V;
    bottomRight: V;
    bottomLeft: V;
}
export interface BorderRadiusObject<V = number> extends Partial<BorderRadiusCorners<V>> {
    top?: V;
    bottom?: V;
    left?: V;
    right?: V;
}
export type BorderRadius<V = number> = V | BorderRadiusObject<V>;
/**
 * Normalize a borderRadius input into explicit corner values.
 *
 * Priority order is:
 * 1. Uniform number
 * 2. Explicit corner
 * 3. Group (top/bottom/left/right)
 * 4. 0
 *
 * We use a generic type here to allow for react-spring animated values.
 *
 * @param radius  either a uniform number, or an object mixing group+corner values
 * @returns       an object with topLeft, topRight, bottomRight, bottomLeft
 */
export declare const normalizeBorderRadius: <V = number>(radius: BorderRadius<V>) => BorderRadiusCorners<V>;
/**
 * Adjusts corner radii so they never exceed half of the width/height or sum constraints.
 */
export declare const constrainBorderRadius: (radius: BorderRadius, width: number, height: number) => BorderRadiusCorners;
//# sourceMappingURL=borderRadius.d.ts.map