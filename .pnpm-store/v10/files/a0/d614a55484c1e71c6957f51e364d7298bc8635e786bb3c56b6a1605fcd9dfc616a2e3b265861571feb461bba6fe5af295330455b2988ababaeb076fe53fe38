import { AnyRoute, AnyRouteMatch } from '@tanstack/router-core';
import { Theme } from './theme.cjs';
import { JSX } from 'solid-js';
export declare const isServer: boolean;
type StyledComponent<T> = T extends 'button' ? JSX.ButtonHTMLAttributes<HTMLButtonElement> : T extends 'input' ? JSX.InputHTMLAttributes<HTMLInputElement> : T extends 'select' ? JSX.SelectHTMLAttributes<HTMLSelectElement> : T extends keyof HTMLElementTagNameMap ? JSX.HTMLAttributes<HTMLElementTagNameMap[T]> : never;
export declare function getStatusColor(match: AnyRouteMatch): "yellow" | "green" | "red" | "purple" | "gray" | "blue";
export declare function getRouteStatusColor(matches: Array<AnyRouteMatch>, route: AnyRoute): "yellow" | "green" | "red" | "purple" | "gray" | "blue";
type Styles = JSX.CSSProperties | ((props: Record<string, any>, theme: Theme) => JSX.CSSProperties);
export declare function styled<T extends keyof HTMLElementTagNameMap>(type: T, newStyles: Styles, queries?: Record<string, Styles>): ({ ref, style, ...rest }: StyledComponent<T> & {
    ref?: HTMLElementTagNameMap[T] | undefined;
}) => JSX.Element;
export declare function useIsMounted(): import('solid-js').Accessor<boolean>;
/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 */
export declare const displayValue: (value: unknown) => string;
/**
 * This hook is a safe useState version which schedules state updates in microtasks
 * to prevent updating a component state while React is rendering different components
 * or when the component is not mounted anymore.
 */
export declare function useSafeState<T>(initialState: T): [T, (value: T) => void];
export declare function multiSortBy<T>(arr: Array<T>, accessors?: Array<(item: T) => any>): Array<T>;
export {};
