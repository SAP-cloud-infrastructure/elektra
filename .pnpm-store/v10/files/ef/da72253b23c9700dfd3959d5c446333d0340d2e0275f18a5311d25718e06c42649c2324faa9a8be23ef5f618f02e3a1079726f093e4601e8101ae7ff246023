import { AnyRouter } from './router.js';
import { ParsedLocation } from './location.js';
import { NonNullableUpdater } from './utils.js';
import { HistoryLocation } from '@tanstack/history';
export type ScrollRestorationEntry = {
    scrollX: number;
    scrollY: number;
};
export type ScrollRestorationByElement = Record<string, ScrollRestorationEntry>;
export type ScrollRestorationByKey = Record<string, ScrollRestorationByElement>;
export type ScrollRestorationCache = {
    state: ScrollRestorationByKey;
    set: (updater: NonNullableUpdater<ScrollRestorationByKey>) => void;
};
export type ScrollRestorationOptions = {
    getKey?: (location: ParsedLocation) => string;
    scrollBehavior?: ScrollToOptions['behavior'];
};
export declare const storageKey = "tsr-scroll-restoration-v1_3";
export declare const scrollRestorationCache: ScrollRestorationCache | undefined;
/**
 * The default `getKey` function for `useScrollRestoration`.
 * It returns the `key` from the location state or the `href` of the location.
 *
 * The `location.href` is used as a fallback to support the use case where the location state is not available like the initial render.
 */
export declare const defaultGetScrollRestorationKey: (location: ParsedLocation) => string;
export declare function getCssSelector(el: any): string;
export declare function restoreScroll({ storageKey, key, behavior, shouldScrollRestoration, scrollToTopSelectors, location, }: {
    storageKey: string;
    key?: string;
    behavior?: ScrollToOptions['behavior'];
    shouldScrollRestoration?: boolean;
    scrollToTopSelectors?: Array<string | (() => Element | null | undefined)>;
    location?: HistoryLocation;
}): void;
export declare function setupScrollRestoration(router: AnyRouter, force?: boolean): void;
