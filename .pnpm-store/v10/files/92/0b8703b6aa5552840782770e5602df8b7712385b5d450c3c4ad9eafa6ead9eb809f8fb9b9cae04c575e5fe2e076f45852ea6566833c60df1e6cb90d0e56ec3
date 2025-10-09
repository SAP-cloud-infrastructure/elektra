export interface NavigateOptions {
    ignoreBlocker?: boolean;
}
type SubscriberHistoryAction = {
    type: Exclude<HistoryAction, 'GO'>;
} | {
    type: 'GO';
    index: number;
};
type SubscriberArgs = {
    location: HistoryLocation;
    action: SubscriberHistoryAction;
};
export interface RouterHistory {
    location: HistoryLocation;
    length: number;
    subscribers: Set<(opts: SubscriberArgs) => void>;
    subscribe: (cb: (opts: SubscriberArgs) => void) => () => void;
    push: (path: string, state?: any, navigateOpts?: NavigateOptions) => void;
    replace: (path: string, state?: any, navigateOpts?: NavigateOptions) => void;
    go: (index: number, navigateOpts?: NavigateOptions) => void;
    back: (navigateOpts?: NavigateOptions) => void;
    forward: (navigateOpts?: NavigateOptions) => void;
    canGoBack: () => boolean;
    createHref: (href: string) => string;
    block: (blocker: NavigationBlocker) => () => void;
    flush: () => void;
    destroy: () => void;
    notify: (action: SubscriberHistoryAction) => void;
    _ignoreSubscribers?: boolean;
}
export interface HistoryLocation extends ParsedPath {
    state: ParsedHistoryState;
}
export interface ParsedPath {
    href: string;
    pathname: string;
    search: string;
    hash: string;
}
export interface HistoryState {
}
export type ParsedHistoryState = HistoryState & {
    key?: string;
    __TSR_key?: string;
    __TSR_index: number;
};
type ShouldAllowNavigation = any;
export type HistoryAction = 'PUSH' | 'REPLACE' | 'FORWARD' | 'BACK' | 'GO';
export type BlockerFnArgs = {
    currentLocation: HistoryLocation;
    nextLocation: HistoryLocation;
    action: HistoryAction;
};
export type BlockerFn = (args: BlockerFnArgs) => Promise<ShouldAllowNavigation> | ShouldAllowNavigation;
export type NavigationBlocker = {
    blockerFn: BlockerFn;
    enableBeforeUnload?: (() => boolean) | boolean;
};
export declare function createHistory(opts: {
    getLocation: () => HistoryLocation;
    getLength: () => number;
    pushState: (path: string, state: any) => void;
    replaceState: (path: string, state: any) => void;
    go: (n: number) => void;
    back: (ignoreBlocker: boolean) => void;
    forward: (ignoreBlocker: boolean) => void;
    createHref: (path: string) => string;
    flush?: () => void;
    destroy?: () => void;
    onBlocked?: () => void;
    getBlockers?: () => Array<NavigationBlocker>;
    setBlockers?: (blockers: Array<NavigationBlocker>) => void;
    notifyOnIndexChange?: boolean;
}): RouterHistory;
/**
 * Creates a history object that can be used to interact with the browser's
 * navigation. This is a lightweight API wrapping the browser's native methods.
 * It is designed to work with TanStack Router, but could be used as a standalone API as well.
 * IMPORTANT: This API implements history throttling via a microtask to prevent
 * excessive calls to the history API. In some browsers, calling history.pushState or
 * history.replaceState in quick succession can cause the browser to ignore subsequent
 * calls. This API smooths out those differences and ensures that your application
 * state will *eventually* match the browser state. In most cases, this is not a problem,
 * but if you need to ensure that the browser state is up to date, you can use the
 * `history.flush` method to immediately flush all pending state changes to the browser URL.
 * @param opts
 * @param opts.getHref A function that returns the current href (path + search + hash)
 * @param opts.createHref A function that takes a path and returns a href (path + search + hash)
 * @returns A history instance
 */
export declare function createBrowserHistory(opts?: {
    parseLocation?: () => HistoryLocation;
    createHref?: (path: string) => string;
    window?: any;
}): RouterHistory;
export declare function createHashHistory(opts?: {
    window?: any;
}): RouterHistory;
export declare function createMemoryHistory(opts?: {
    initialEntries: Array<string>;
    initialIndex?: number;
}): RouterHistory;
export declare function parseHref(href: string, state: ParsedHistoryState | undefined): HistoryLocation;
export {};
