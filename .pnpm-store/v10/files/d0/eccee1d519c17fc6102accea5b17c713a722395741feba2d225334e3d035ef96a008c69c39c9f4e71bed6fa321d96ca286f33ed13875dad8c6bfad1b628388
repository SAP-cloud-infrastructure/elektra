import { Store } from '@tanstack/store';
import { loadRouteChunk } from './load-matches.js';
import { ParsePathnameCache } from './path.js';
import { SearchParser, SearchSerializer } from './searchParams.js';
import { AnyRedirect, ResolvedRedirect } from './redirect.js';
import { HistoryLocation, HistoryState, ParsedHistoryState, RouterHistory } from '@tanstack/history';
import { Awaitable, ControlledPromise, NoInfer, NonNullableUpdater, PickAsRequired, Updater } from './utils.js';
import { ParsedLocation } from './location.js';
import { AnyContext, AnyRoute, AnyRouteWithContext, MakeRemountDepsOptionsUnion, RouteMask } from './route.js';
import { FullSearchSchema, RouteById, RoutePaths, RoutesById, RoutesByPath } from './routeInfo.js';
import { AnyRouteMatch, MakeRouteMatchUnion, MatchRouteOptions } from './Matches.js';
import { BuildLocationFn, CommitLocationOptions, NavigateFn } from './RouterProvider.js';
import { Manifest } from './manifest.js';
import { AnySchema } from './validators.js';
import { NavigateOptions, ResolveRelativePath, ToOptions } from './link.js';
export type ControllablePromise<T = any> = Promise<T> & {
    resolve: (value: T) => void;
    reject: (value?: any) => void;
};
export type InjectedHtmlEntry = Promise<string>;
export interface DefaultRegister {
    router: AnyRouter;
}
export interface Register extends DefaultRegister {
}
export type RegisteredRouter = Register['router'];
export type DefaultRemountDepsFn<TRouteTree extends AnyRoute> = (opts: MakeRemountDepsOptionsUnion<TRouteTree>) => any;
export interface DefaultRouterOptionsExtensions {
}
export interface RouterOptionsExtensions extends DefaultRouterOptionsExtensions {
}
export interface RouterOptions<TRouteTree extends AnyRoute, TTrailingSlashOption extends TrailingSlashOption, TDefaultStructuralSharingOption extends boolean = false, TRouterHistory extends RouterHistory = RouterHistory, TDehydrated extends Record<string, any> = Record<string, any>> extends RouterOptionsExtensions {
    /**
     * The history object that will be used to manage the browser history.
     *
     * If not provided, a new createBrowserHistory instance will be created and used.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#history-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/history-types)
     */
    history?: TRouterHistory;
    /**
     * A function that will be used to stringify search params when generating links.
     *
     * @default defaultStringifySearch
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#stringifysearch-method)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization)
     */
    stringifySearch?: SearchSerializer;
    /**
     * A function that will be used to parse search params when parsing the current location.
     *
     * @default defaultParseSearch
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#parsesearch-method)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization)
     */
    parseSearch?: SearchParser;
    /**
     * If `false`, routes will not be preloaded by default in any way.
     *
     * If `'intent'`, routes will be preloaded by default when the user hovers over a link or a `touchstart` event is detected on a `<Link>`.
     *
     * If `'viewport'`, routes will be preloaded by default when they are within the viewport.
     *
     * @default false
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpreload-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)
     */
    defaultPreload?: false | 'intent' | 'viewport' | 'render';
    /**
     * The delay in milliseconds that a route must be hovered over or touched before it is preloaded.
     *
     * @default 50
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpreloaddelay-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/preloading#preload-delay)
     */
    defaultPreloadDelay?: number;
    /**
     * The default `preloadIntentProximity` a route should use if no preloadIntentProximity is provided.
     *
     * @default 0
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpreloadintentproximity-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/preloading#preload-intent-proximity)
     */
    defaultPreloadIntentProximity?: number;
    /**
     * The default `pendingMs` a route should use if no pendingMs is provided.
     *
     * @default 1000
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpendingms-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#avoiding-pending-component-flash)
     */
    defaultPendingMs?: number;
    /**
     * The default `pendingMinMs` a route should use if no pendingMinMs is provided.
     *
     * @default 500
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpendingminms-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#avoiding-pending-component-flash)
     */
    defaultPendingMinMs?: number;
    /**
     * The default `staleTime` a route should use if no staleTime is provided. This is the time in milliseconds that a route will be considered fresh.
     *
     * @default 0
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultstaletime-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#key-options)
     */
    defaultStaleTime?: number;
    /**
     * The default `preloadStaleTime` a route should use if no preloadStaleTime is provided.
     *
     * @default 30_000 `(30 seconds)`
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpreloadstaletime-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)
     */
    defaultPreloadStaleTime?: number;
    /**
     * The default `defaultPreloadGcTime` a route should use if no preloadGcTime is provided.
     *
     * @default 1_800_000 `(30 minutes)`
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultpreloadgctime-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)
     */
    defaultPreloadGcTime?: number;
    /**
     * If `true`, route navigations will called using `document.startViewTransition()`.
     *
     * If the browser does not support this api, this option will be ignored.
     *
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) for more information on how this function works.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultviewtransition-property)
     */
    defaultViewTransition?: boolean | ViewTransitionOptions;
    /**
     * The default `hashScrollIntoView` a route should use if no hashScrollIntoView is provided while navigating
     *
     * See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) for more information on `ScrollIntoViewOptions`.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaulthashscrollintoview-property)
     */
    defaultHashScrollIntoView?: boolean | ScrollIntoViewOptions;
    /**
     * @default 'fuzzy'
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#notfoundmode-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors#the-notfoundmode-option)
     */
    notFoundMode?: 'root' | 'fuzzy';
    /**
     * The default `gcTime` a route should use if no gcTime is provided.
     *
     * @default 1_800_000 `(30 minutes)`
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultgctime-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#key-options)
     */
    defaultGcTime?: number;
    /**
     * If `true`, all routes will be matched as case-sensitive.
     *
     * @default false
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#casesensitive-property)
     */
    caseSensitive?: boolean;
    /**
     *
     * The route tree that will be used to configure the router instance.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#routetree-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/routing/route-trees)
     */
    routeTree?: TRouteTree;
    /**
     * The basepath for then entire router. This is useful for mounting a router instance at a subpath.
     *
     * @default '/'
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#basepath-property)
     */
    basepath?: string;
    /**
     * The root context that will be provided to all routes in the route tree.
     *
     * This can be used to provide a context to all routes in the tree without having to provide it to each route individually.
     *
     * Optional or required if the root route was created with [`createRootRouteWithContext()`](https://tanstack.com/router/latest/docs/framework/react/api/router/createRootRouteWithContextFunction).
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#context-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/router-context)
     */
    context?: InferRouterContext<TRouteTree>;
    /**
     * A function that will be called when the router is dehydrated.
     *
     * The return value of this function will be serialized and stored in the router's dehydrated state.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#dehydrate-method)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading#critical-dehydrationhydration)
     */
    dehydrate?: () => Awaitable<TDehydrated>;
    /**
     * A function that will be called when the router is hydrated.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#hydrate-method)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading#critical-dehydrationhydration)
     */
    hydrate?: (dehydrated: TDehydrated) => Awaitable<void>;
    /**
     * An array of route masks that will be used to mask routes in the route tree.
     *
     * Route masking is when you display a route at a different path than the one it is configured to match, like a modal popup that when shared will unmask to the modal's content instead of the modal's context.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#routemasks-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/route-masking)
     */
    routeMasks?: Array<RouteMask<TRouteTree>>;
    /**
     * If `true`, route masks will, by default, be removed when the page is reloaded.
     *
     * This can be overridden on a per-mask basis by setting the `unmaskOnReload` option on the mask, or on a per-navigation basis by setting the `unmaskOnReload` option in the `Navigate` options.
     *
     * @default false
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#unmaskonreload-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/route-masking#unmasking-on-page-reload)
     */
    unmaskOnReload?: boolean;
    /**
     * Use `notFoundComponent` instead.
     *
     * @deprecated
     * See https://tanstack.com/router/v1/docs/guide/not-found-errors#migrating-from-notfoundroute for more info.
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#notfoundroute-property)
     */
    notFoundRoute?: AnyRoute;
    /**
     * Configures how trailing slashes are treated.
     *
     * - `'always'` will add a trailing slash if not present
     * - `'never'` will remove the trailing slash if present
     * - `'preserve'` will not modify the trailing slash.
     *
     * @default 'never'
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#trailingslash-property)
     */
    trailingSlash?: TTrailingSlashOption;
    /**
     * While usually automatic, sometimes it can be useful to force the router into a server-side state, e.g. when using the router in a non-browser environment that has access to a global.document object.
     *
     * @default typeof document !== 'undefined'
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#isserver-property)
     */
    isServer?: boolean;
    /**
     * @default false
     */
    isShell?: boolean;
    /**
     * @default false
     */
    isPrerendering?: boolean;
    /**
     * The default `ssr` a route should use if no `ssr` is provided.
     *
     * @default true
     */
    defaultSsr?: boolean | 'data-only';
    search?: {
        /**
         * Configures how unknown search params (= not returned by any `validateSearch`) are treated.
         *
         * @default false
         * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#search.strict-property)
         */
        strict?: boolean;
    };
    /**
     * Configures whether structural sharing is enabled by default for fine-grained selectors.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#defaultstructuralsharing-property)
     */
    defaultStructuralSharing?: TDefaultStructuralSharingOption;
    /**
     * Configures which URI characters are allowed in path params that would ordinarily be escaped by encodeURIComponent.
     *
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RouterOptionsType#pathparamsallowedcharacters-property)
     * @link [Guide](https://tanstack.com/router/latest/docs/framework/react/guide/path-params#allowed-characters)
     */
    pathParamsAllowedCharacters?: Array<';' | ':' | '@' | '&' | '=' | '+' | '$' | ','>;
    defaultRemountDeps?: DefaultRemountDepsFn<TRouteTree>;
    /**
     * If `true`, scroll restoration will be enabled
     *
     * @default false
     */
    scrollRestoration?: boolean;
    /**
     * A function that will be called to get the key for the scroll restoration cache.
     *
     * @default (location) => location.href
     */
    getScrollRestorationKey?: (location: ParsedLocation) => string;
    /**
     * The default behavior for scroll restoration.
     *
     * @default 'auto'
     */
    scrollRestorationBehavior?: ScrollBehavior;
    /**
     * An array of selectors that will be used to scroll to the top of the page in addition to `window`
     *
     * @default ['window']
     */
    scrollToTopSelectors?: Array<string | (() => Element | null | undefined)>;
    /**
     * When `true`, disables the global catch boundary that normally wraps all route matches.
     * This allows unhandled errors to bubble up to top-level error handlers in the browser.
     *
     * Useful for testing tools (like Storybook Test Runner), error reporting services,
     * and debugging scenarios where you want errors to reach the browser's global error handlers.
     *
     * @default false
     */
    disableGlobalCatchBoundary?: boolean;
}
export interface RouterState<in out TRouteTree extends AnyRoute = AnyRoute, in out TRouteMatch = MakeRouteMatchUnion> {
    status: 'pending' | 'idle';
    loadedAt: number;
    isLoading: boolean;
    isTransitioning: boolean;
    matches: Array<TRouteMatch>;
    pendingMatches?: Array<TRouteMatch>;
    cachedMatches: Array<TRouteMatch>;
    location: ParsedLocation<FullSearchSchema<TRouteTree>>;
    resolvedLocation?: ParsedLocation<FullSearchSchema<TRouteTree>>;
    statusCode: number;
    redirect?: AnyRedirect;
}
export interface BuildNextOptions {
    to?: string | number | null;
    params?: true | Updater<unknown>;
    search?: true | Updater<unknown>;
    hash?: true | Updater<string>;
    state?: true | NonNullableUpdater<ParsedHistoryState, HistoryState>;
    mask?: {
        to?: string | number | null;
        params?: true | Updater<unknown>;
        search?: true | Updater<unknown>;
        hash?: true | Updater<string>;
        state?: true | NonNullableUpdater<ParsedHistoryState, HistoryState>;
        unmaskOnReload?: boolean;
    };
    from?: string;
    href?: string;
    _fromLocation?: ParsedLocation;
    unsafeRelative?: 'path';
    _isNavigate?: boolean;
}
type NavigationEventInfo = {
    fromLocation?: ParsedLocation;
    toLocation: ParsedLocation;
    pathChanged: boolean;
    hrefChanged: boolean;
    hashChanged: boolean;
};
export interface RouterEvents {
    onBeforeNavigate: {
        type: 'onBeforeNavigate';
    } & NavigationEventInfo;
    onBeforeLoad: {
        type: 'onBeforeLoad';
    } & NavigationEventInfo;
    onLoad: {
        type: 'onLoad';
    } & NavigationEventInfo;
    onResolved: {
        type: 'onResolved';
    } & NavigationEventInfo;
    onBeforeRouteMount: {
        type: 'onBeforeRouteMount';
    } & NavigationEventInfo;
    onRendered: {
        type: 'onRendered';
    } & NavigationEventInfo;
}
export type RouterEvent = RouterEvents[keyof RouterEvents];
export type ListenerFn<TEvent extends RouterEvent> = (event: TEvent) => void;
export type RouterListener<TRouterEvent extends RouterEvent> = {
    eventType: TRouterEvent['type'];
    fn: ListenerFn<TRouterEvent>;
};
export type SubscribeFn = <TType extends keyof RouterEvents>(eventType: TType, fn: ListenerFn<RouterEvents[TType]>) => () => void;
export interface MatchRoutesOpts {
    preload?: boolean;
    throwOnError?: boolean;
    _buildLocation?: boolean;
    dest?: BuildNextOptions;
}
export type InferRouterContext<TRouteTree extends AnyRoute> = TRouteTree['types']['routerContext'];
export type RouterContextOptions<TRouteTree extends AnyRoute> = AnyContext extends InferRouterContext<TRouteTree> ? {
    context?: InferRouterContext<TRouteTree>;
} : {
    context: InferRouterContext<TRouteTree>;
};
export type RouterConstructorOptions<TRouteTree extends AnyRoute, TTrailingSlashOption extends TrailingSlashOption, TDefaultStructuralSharingOption extends boolean, TRouterHistory extends RouterHistory, TDehydrated extends Record<string, any>> = Omit<RouterOptions<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>, 'context'> & RouterContextOptions<TRouteTree>;
export type PreloadRouteFn<TRouteTree extends AnyRoute, TTrailingSlashOption extends TrailingSlashOption, TDefaultStructuralSharingOption extends boolean, TRouterHistory extends RouterHistory> = <TFrom extends RoutePaths<TRouteTree> | string = string, TTo extends string | undefined = undefined, TMaskFrom extends RoutePaths<TRouteTree> | string = TFrom, TMaskTo extends string = ''>(opts: NavigateOptions<RouterCore<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory>, TFrom, TTo, TMaskFrom, TMaskTo>) => Promise<Array<AnyRouteMatch> | undefined>;
export type MatchRouteFn<TRouteTree extends AnyRoute, TTrailingSlashOption extends TrailingSlashOption, TDefaultStructuralSharingOption extends boolean, TRouterHistory extends RouterHistory> = <TFrom extends RoutePaths<TRouteTree> = '/', TTo extends string | undefined = undefined, TResolved = ResolveRelativePath<TFrom, NoInfer<TTo>>>(location: ToOptions<RouterCore<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory>, TFrom, TTo>, opts?: MatchRouteOptions) => false | RouteById<TRouteTree, TResolved>['types']['allParams'];
export type UpdateFn<TRouteTree extends AnyRoute, TTrailingSlashOption extends TrailingSlashOption, TDefaultStructuralSharingOption extends boolean, TRouterHistory extends RouterHistory, TDehydrated extends Record<string, any>> = (newOptions: RouterConstructorOptions<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>) => void;
export type InvalidateFn<TRouter extends AnyRouter> = (opts?: {
    filter?: (d: MakeRouteMatchUnion<TRouter>) => boolean;
    sync?: boolean;
    forcePending?: boolean;
}) => Promise<void>;
export type ParseLocationFn<TRouteTree extends AnyRoute> = (locationToParse: HistoryLocation, previousLocation?: ParsedLocation<FullSearchSchema<TRouteTree>>) => ParsedLocation<FullSearchSchema<TRouteTree>>;
export type GetMatchRoutesFn = (pathname: string, routePathname: string | undefined) => {
    matchedRoutes: Array<AnyRoute>;
    routeParams: Record<string, string>;
    foundRoute: AnyRoute | undefined;
};
export type EmitFn = (routerEvent: RouterEvent) => void;
export type LoadFn = (opts?: {
    sync?: boolean;
}) => Promise<void>;
export type CommitLocationFn = ({ viewTransition, ignoreBlocker, ...next }: ParsedLocation & CommitLocationOptions) => Promise<void>;
export type StartTransitionFn = (fn: () => void) => void;
export interface MatchRoutesFn {
    (pathname: string, locationSearch?: AnySchema, opts?: MatchRoutesOpts): Array<MakeRouteMatchUnion>;
    /**
     * @deprecated use the following signature instead
     */
    (next: ParsedLocation, opts?: MatchRoutesOpts): Array<AnyRouteMatch>;
    (pathnameOrNext: string | ParsedLocation, locationSearchOrOpts?: AnySchema | MatchRoutesOpts, opts?: MatchRoutesOpts): Array<AnyRouteMatch>;
}
export type GetMatchFn = (matchId: string) => AnyRouteMatch | undefined;
export type UpdateMatchFn = (id: string, updater: (match: AnyRouteMatch) => AnyRouteMatch) => void;
export type LoadRouteChunkFn = (route: AnyRoute) => Promise<Array<void>>;
export type ResolveRedirect = (err: AnyRedirect) => ResolvedRedirect;
export type ClearCacheFn<TRouter extends AnyRouter> = (opts?: {
    filter?: (d: MakeRouteMatchUnion<TRouter>) => boolean;
}) => void;
export interface ServerSsr {
    injectedHtml: Array<InjectedHtmlEntry>;
    injectHtml: (getHtml: () => string | Promise<string>) => Promise<void>;
    injectScript: (getScript: () => string | Promise<string>, opts?: {
        logScript?: boolean;
    }) => Promise<void>;
    isDehydrated: () => boolean;
    onRenderFinished: (listener: () => void) => void;
    dehydrate: () => Promise<void>;
}
export type AnyRouterWithContext<TContext> = RouterCore<AnyRouteWithContext<TContext>, any, any, any, any>;
export type AnyRouter = RouterCore<any, any, any, any, any>;
export interface ViewTransitionOptions {
    types: Array<string> | ((locationChangeInfo: {
        fromLocation?: ParsedLocation;
        toLocation: ParsedLocation;
        pathChanged: boolean;
        hrefChanged: boolean;
        hashChanged: boolean;
    }) => Array<string>);
}
export declare function defaultSerializeError(err: unknown): {
    name: string;
    message: string;
} | {
    data: unknown;
};
export type TrailingSlashOption = 'always' | 'never' | 'preserve';
export declare function getLocationChangeInfo(routerState: {
    resolvedLocation?: ParsedLocation;
    location: ParsedLocation;
}): {
    fromLocation: ParsedLocation<{}> | undefined;
    toLocation: ParsedLocation<{}>;
    pathChanged: boolean;
    hrefChanged: boolean;
    hashChanged: boolean;
};
export type CreateRouterFn = <TRouteTree extends AnyRoute, TTrailingSlashOption extends TrailingSlashOption = 'never', TDefaultStructuralSharingOption extends boolean = false, TRouterHistory extends RouterHistory = RouterHistory, TDehydrated extends Record<string, any> = Record<string, any>>(options: undefined extends number ? 'strictNullChecks must be enabled in tsconfig.json' : RouterConstructorOptions<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>) => RouterCore<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>;
export declare class RouterCore<in out TRouteTree extends AnyRoute, in out TTrailingSlashOption extends TrailingSlashOption, in out TDefaultStructuralSharingOption extends boolean, in out TRouterHistory extends RouterHistory = RouterHistory, in out TDehydrated extends Record<string, any> = Record<string, any>> {
    tempLocationKey: string | undefined;
    resetNextScroll: boolean;
    shouldViewTransition?: boolean | ViewTransitionOptions;
    isViewTransitionTypesSupported?: boolean;
    subscribers: Set<RouterListener<RouterEvent>>;
    viewTransitionPromise?: ControlledPromise<true>;
    isScrollRestoring: boolean;
    isScrollRestorationSetup: boolean;
    __store: Store<RouterState<TRouteTree>>;
    options: PickAsRequired<RouterOptions<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>, 'stringifySearch' | 'parseSearch' | 'context'>;
    history: TRouterHistory;
    latestLocation: ParsedLocation<FullSearchSchema<TRouteTree>>;
    basepath: string;
    routeTree: TRouteTree;
    routesById: RoutesById<TRouteTree>;
    routesByPath: RoutesByPath<TRouteTree>;
    flatRoutes: Array<AnyRoute>;
    isServer: boolean;
    pathParamsDecodeCharMap?: Map<string, string>;
    /**
     * @deprecated Use the `createRouter` function instead
     */
    constructor(options: RouterConstructorOptions<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>);
    startTransition: StartTransitionFn;
    isShell(): boolean;
    isPrerendering(): boolean;
    update: UpdateFn<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>;
    get state(): RouterState<TRouteTree, import('./Matches.js').RouteMatch<any, any, any, any, any, any, any>>;
    updateLatestLocation: () => void;
    buildRouteTree: () => void;
    subscribe: SubscribeFn;
    emit: EmitFn;
    parseLocation: ParseLocationFn<TRouteTree>;
    resolvePathWithBase: (from: string, path: string) => string;
    get looseRoutesById(): Record<string, AnyRoute>;
    matchRoutes: MatchRoutesFn;
    private matchRoutesInternal;
    /** a cache for `parsePathname` */
    private parsePathnameCache;
    getMatchedRoutes: GetMatchRoutesFn;
    cancelMatch: (id: string) => void;
    cancelMatches: () => void;
    buildLocation: BuildLocationFn;
    commitLocationPromise: undefined | ControlledPromise<void>;
    commitLocation: CommitLocationFn;
    buildAndCommitLocation: ({ replace, resetScroll, hashScrollIntoView, viewTransition, ignoreBlocker, href, ...rest }?: BuildNextOptions & CommitLocationOptions) => Promise<void>;
    navigate: NavigateFn;
    latestLoadPromise: undefined | Promise<void>;
    beforeLoad: () => void;
    load: LoadFn;
    startViewTransition: (fn: () => Promise<void>) => void;
    updateMatch: UpdateMatchFn;
    getMatch: GetMatchFn;
    invalidate: InvalidateFn<RouterCore<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory, TDehydrated>>;
    resolveRedirect: (redirect: AnyRedirect) => AnyRedirect;
    clearCache: ClearCacheFn<this>;
    clearExpiredCache: () => void;
    loadRouteChunk: typeof loadRouteChunk;
    preloadRoute: PreloadRouteFn<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory>;
    matchRoute: MatchRouteFn<TRouteTree, TTrailingSlashOption, TDefaultStructuralSharingOption, TRouterHistory>;
    ssr?: {
        manifest: Manifest | undefined;
    };
    serverSsr?: ServerSsr;
    hasNotFoundMatch: () => boolean;
}
export declare class SearchParamError extends Error {
}
export declare class PathParamError extends Error {
}
export declare function lazyFn<T extends Record<string, (...args: Array<any>) => any>, TKey extends keyof T = 'default'>(fn: () => Promise<T>, key?: TKey): (...args: Parameters<T[TKey]>) => Promise<Awaited<ReturnType<T[TKey]>>>;
export declare function getInitialRouterState(location: ParsedLocation): RouterState<any>;
interface RouteLike {
    id: string;
    isRoot?: boolean;
    path?: string;
    fullPath: string;
    rank?: number;
    parentRoute?: RouteLike;
    children?: Array<RouteLike>;
    options?: {
        caseSensitive?: boolean;
    };
}
export type ProcessRouteTreeResult<TRouteLike extends RouteLike> = {
    routesById: Record<string, TRouteLike>;
    routesByPath: Record<string, TRouteLike>;
    flatRoutes: Array<TRouteLike>;
};
export declare function processRouteTree<TRouteLike extends RouteLike>({ routeTree, initRoute, }: {
    routeTree: TRouteLike;
    initRoute?: (route: TRouteLike, index: number) => void;
}): ProcessRouteTreeResult<TRouteLike>;
export declare function getMatchedRoutes<TRouteLike extends RouteLike>({ pathname, routePathname, basepath, caseSensitive, routesByPath, routesById, flatRoutes, parseCache, }: {
    pathname: string;
    routePathname?: string;
    basepath: string;
    caseSensitive?: boolean;
    routesByPath: Record<string, TRouteLike>;
    routesById: Record<string, TRouteLike>;
    flatRoutes: Array<TRouteLike>;
    parseCache?: ParsePathnameCache;
}): {
    matchedRoutes: TRouteLike[];
    routeParams: Record<string, string>;
    foundRoute: TRouteLike | undefined;
};
export {};
