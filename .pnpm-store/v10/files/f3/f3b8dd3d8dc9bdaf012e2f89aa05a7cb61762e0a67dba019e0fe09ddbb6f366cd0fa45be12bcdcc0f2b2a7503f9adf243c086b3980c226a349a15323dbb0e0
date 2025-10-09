import { BaseRootRoute, BaseRoute, BaseRouteApi, AnyContext, AnyRoute, AnyRouter, ConstrainLiteral, ErrorComponentProps, NotFoundError, NotFoundRouteProps, RegisteredRouter, ResolveFullPath, ResolveId, ResolveParams, RootRoute as RootRouteCore, RootRouteId, RootRouteOptions, RouteConstraints, Route as RouteCore, RouteIds, RouteMask, RouteOptions, RouteTypesById, RouterCore, ToMaskOptions, UseNavigateResult } from '@tanstack/router-core';
import { default as React } from 'react';
import { UseLoaderDataRoute } from './useLoaderData.cjs';
import { UseMatchRoute } from './useMatch.cjs';
import { UseLoaderDepsRoute } from './useLoaderDeps.cjs';
import { UseParamsRoute } from './useParams.cjs';
import { UseSearchRoute } from './useSearch.cjs';
import { UseRouteContextRoute } from './useRouteContext.cjs';
import { LinkComponentRoute } from './link.cjs';
declare module '@tanstack/router-core' {
    interface UpdatableRouteOptionsExtensions {
        component?: RouteComponent;
        errorComponent?: false | null | undefined | ErrorRouteComponent;
        notFoundComponent?: NotFoundRouteComponent;
        pendingComponent?: RouteComponent;
    }
    interface RootRouteOptionsExtensions {
        shellComponent?: ({ children, }: {
            children: React.ReactNode;
        }) => React.ReactNode;
    }
    interface RouteExtensions<in out TId extends string, in out TFullPath extends string> {
        useMatch: UseMatchRoute<TId>;
        useRouteContext: UseRouteContextRoute<TId>;
        useSearch: UseSearchRoute<TId>;
        useParams: UseParamsRoute<TId>;
        useLoaderDeps: UseLoaderDepsRoute<TId>;
        useLoaderData: UseLoaderDataRoute<TId>;
        useNavigate: () => UseNavigateResult<TFullPath>;
        Link: LinkComponentRoute<TFullPath>;
    }
}
export declare function getRouteApi<const TId, TRouter extends AnyRouter = RegisteredRouter>(id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>): RouteApi<TId, TRouter>;
export declare class RouteApi<TId, TRouter extends AnyRouter = RegisteredRouter> extends BaseRouteApi<TId, TRouter> {
    /**
     * @deprecated Use the `getRouteApi` function instead.
     */
    constructor({ id }: {
        id: TId;
    });
    useMatch: UseMatchRoute<TId>;
    useRouteContext: UseRouteContextRoute<TId>;
    useSearch: UseSearchRoute<TId>;
    useParams: UseParamsRoute<TId>;
    useLoaderDeps: UseLoaderDepsRoute<TId>;
    useLoaderData: UseLoaderDataRoute<TId>;
    useNavigate: () => UseNavigateResult<RouteTypesById<TRouter, TId>["fullPath"]>;
    notFound: (opts?: NotFoundError) => NotFoundError;
    Link: LinkComponentRoute<RouteTypesById<TRouter, TId>['fullPath']>;
}
export declare class Route<in out TParentRoute extends RouteConstraints['TParentRoute'] = AnyRoute, in out TPath extends RouteConstraints['TPath'] = '/', in out TFullPath extends RouteConstraints['TFullPath'] = ResolveFullPath<TParentRoute, TPath>, in out TCustomId extends RouteConstraints['TCustomId'] = string, in out TId extends RouteConstraints['TId'] = ResolveId<TParentRoute, TCustomId, TPath>, in out TSearchValidator = undefined, in out TParams = ResolveParams<TPath>, in out TRouterContext = AnyContext, in out TRouteContextFn = AnyContext, in out TBeforeLoadFn = AnyContext, in out TLoaderDeps extends Record<string, any> = {}, in out TLoaderFn = undefined, in out TChildren = unknown, in out TFileRouteTypes = unknown> extends BaseRoute<TParentRoute, TPath, TFullPath, TCustomId, TId, TSearchValidator, TParams, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren, TFileRouteTypes> implements RouteCore<TParentRoute, TPath, TFullPath, TCustomId, TId, TSearchValidator, TParams, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren, TFileRouteTypes> {
    /**
     * @deprecated Use the `createRoute` function instead.
     */
    constructor(options?: RouteOptions<TParentRoute, TId, TCustomId, TFullPath, TPath, TSearchValidator, TParams, TLoaderDeps, TLoaderFn, TRouterContext, TRouteContextFn, TBeforeLoadFn>);
    useMatch: UseMatchRoute<TId>;
    useRouteContext: UseRouteContextRoute<TId>;
    useSearch: UseSearchRoute<TId>;
    useParams: UseParamsRoute<TId>;
    useLoaderDeps: UseLoaderDepsRoute<TId>;
    useLoaderData: UseLoaderDataRoute<TId>;
    useNavigate: () => UseNavigateResult<TFullPath>;
    Link: LinkComponentRoute<TFullPath>;
}
export declare function createRoute<TParentRoute extends RouteConstraints['TParentRoute'] = AnyRoute, TPath extends RouteConstraints['TPath'] = '/', TFullPath extends RouteConstraints['TFullPath'] = ResolveFullPath<TParentRoute, TPath>, TCustomId extends RouteConstraints['TCustomId'] = string, TId extends RouteConstraints['TId'] = ResolveId<TParentRoute, TCustomId, TPath>, TSearchValidator = undefined, TParams = ResolveParams<TPath>, TRouteContextFn = AnyContext, TBeforeLoadFn = AnyContext, TLoaderDeps extends Record<string, any> = {}, TLoaderFn = undefined, TChildren = unknown>(options: RouteOptions<TParentRoute, TId, TCustomId, TFullPath, TPath, TSearchValidator, TParams, TLoaderDeps, TLoaderFn, AnyContext, TRouteContextFn, TBeforeLoadFn>): Route<TParentRoute, TPath, TFullPath, TCustomId, TId, TSearchValidator, TParams, AnyContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren>;
export type AnyRootRoute = RootRoute<any, any, any, any, any, any, any, any>;
export declare function createRootRouteWithContext<TRouterContext extends {}>(): <TRouteContextFn = AnyContext, TBeforeLoadFn = AnyContext, TSearchValidator = undefined, TLoaderDeps extends Record<string, any> = {}, TLoaderFn = undefined>(options?: RootRouteOptions<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn>) => RootRoute<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, unknown, unknown>;
/**
 * @deprecated Use the `createRootRouteWithContext` function instead.
 */
export declare const rootRouteWithContext: typeof createRootRouteWithContext;
export declare class RootRoute<in out TSearchValidator = undefined, in out TRouterContext = {}, in out TRouteContextFn = AnyContext, in out TBeforeLoadFn = AnyContext, in out TLoaderDeps extends Record<string, any> = {}, in out TLoaderFn = undefined, in out TChildren = unknown, in out TFileRouteTypes = unknown> extends BaseRootRoute<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren, TFileRouteTypes> implements RootRouteCore<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren, TFileRouteTypes> {
    /**
     * @deprecated `RootRoute` is now an internal implementation detail. Use `createRootRoute()` instead.
     */
    constructor(options?: RootRouteOptions<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn>);
    useMatch: UseMatchRoute<RootRouteId>;
    useRouteContext: UseRouteContextRoute<RootRouteId>;
    useSearch: UseSearchRoute<RootRouteId>;
    useParams: UseParamsRoute<RootRouteId>;
    useLoaderDeps: UseLoaderDepsRoute<RootRouteId>;
    useLoaderData: UseLoaderDataRoute<RootRouteId>;
    useNavigate: () => UseNavigateResult<"/">;
    Link: LinkComponentRoute<'/'>;
}
export declare function createRootRoute<TSearchValidator = undefined, TRouterContext = {}, TRouteContextFn = AnyContext, TBeforeLoadFn = AnyContext, TLoaderDeps extends Record<string, any> = {}, TLoaderFn = undefined>(options?: RootRouteOptions<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn>): RootRoute<TSearchValidator, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, unknown, unknown>;
export declare function createRouteMask<TRouteTree extends AnyRoute, TFrom extends string, TTo extends string>(opts: {
    routeTree: TRouteTree;
} & ToMaskOptions<RouterCore<TRouteTree, 'never', boolean>, TFrom, TTo>): RouteMask<TRouteTree>;
export interface DefaultRouteTypes<TProps> {
    component: ((props: TProps) => any) | React.LazyExoticComponent<(props: TProps) => any>;
}
export interface RouteTypes<TProps> extends DefaultRouteTypes<TProps> {
}
export type AsyncRouteComponent<TProps> = RouteTypes<TProps>['component'] & {
    preload?: () => Promise<void>;
};
export type RouteComponent = AsyncRouteComponent<{}>;
export type ErrorRouteComponent = AsyncRouteComponent<ErrorComponentProps>;
export type NotFoundRouteComponent = RouteTypes<NotFoundRouteProps>['component'];
export declare class NotFoundRoute<TParentRoute extends AnyRootRoute, TRouterContext = AnyContext, TRouteContextFn = AnyContext, TBeforeLoadFn = AnyContext, TSearchValidator = undefined, TLoaderDeps extends Record<string, any> = {}, TLoaderFn = undefined, TChildren = unknown> extends Route<TParentRoute, '/404', '/404', '404', '404', TSearchValidator, {}, TRouterContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren> {
    constructor(options: Omit<RouteOptions<TParentRoute, string, string, string, string, TSearchValidator, {}, TLoaderDeps, TLoaderFn, TRouterContext, TRouteContextFn, TBeforeLoadFn>, 'caseSensitive' | 'parseParams' | 'stringifyParams' | 'path' | 'id' | 'params'>);
}
