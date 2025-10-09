import { UseParamsRoute } from './useParams.js';
import { UseMatchRoute } from './useMatch.js';
import { UseSearchRoute } from './useSearch.js';
import { AnyContext, AnyRoute, AnyRouter, Constrain, ConstrainLiteral, FileBaseRouteOptions, FileRoutesByPath, LazyRouteOptions, RegisteredRouter, ResolveParams, Route, RouteById, RouteConstraints, RouteIds, RouteLoaderFn, UpdatableRouteOptions, UseNavigateResult } from '@tanstack/router-core';
import { UseLoaderDepsRoute } from './useLoaderDeps.js';
import { UseLoaderDataRoute } from './useLoaderData.js';
import { UseRouteContextRoute } from './useRouteContext.js';
export declare function createFileRoute<TFilePath extends keyof FileRoutesByPath, TParentRoute extends AnyRoute = FileRoutesByPath[TFilePath]['parentRoute'], TId extends RouteConstraints['TId'] = FileRoutesByPath[TFilePath]['id'], TPath extends RouteConstraints['TPath'] = FileRoutesByPath[TFilePath]['path'], TFullPath extends RouteConstraints['TFullPath'] = FileRoutesByPath[TFilePath]['fullPath']>(path?: TFilePath): FileRoute<TFilePath, TParentRoute, TId, TPath, TFullPath>['createRoute'];
/**
  @deprecated It's no longer recommended to use the `FileRoute` class directly.
  Instead, use `createFileRoute('/path/to/file')(options)` to create a file route.
*/
export declare class FileRoute<TFilePath extends keyof FileRoutesByPath, TParentRoute extends AnyRoute = FileRoutesByPath[TFilePath]['parentRoute'], TId extends RouteConstraints['TId'] = FileRoutesByPath[TFilePath]['id'], TPath extends RouteConstraints['TPath'] = FileRoutesByPath[TFilePath]['path'], TFullPath extends RouteConstraints['TFullPath'] = FileRoutesByPath[TFilePath]['fullPath']> {
    path?: TFilePath | undefined;
    silent?: boolean;
    constructor(path?: TFilePath | undefined, _opts?: {
        silent: boolean;
    });
    createRoute: <TSearchValidator = undefined, TParams = ResolveParams<TPath>, TRouteContextFn = AnyContext, TBeforeLoadFn = AnyContext, TLoaderDeps extends Record<string, any> = {}, TLoaderFn = undefined, TChildren = unknown>(options?: FileBaseRouteOptions<TParentRoute, TId, TPath, TSearchValidator, TParams, TLoaderDeps, TLoaderFn, AnyContext, TRouteContextFn, TBeforeLoadFn> & UpdatableRouteOptions<TParentRoute, TId, TFullPath, TParams, TSearchValidator, TLoaderFn, TLoaderDeps, AnyContext, TRouteContextFn, TBeforeLoadFn>) => Route<TParentRoute, TPath, TFullPath, TFilePath, TId, TSearchValidator, TParams, AnyContext, TRouteContextFn, TBeforeLoadFn, TLoaderDeps, TLoaderFn, TChildren, unknown>;
}
/**
  @deprecated It's recommended not to split loaders into separate files.
  Instead, place the loader function in the the main route file, inside the
  `createFileRoute('/path/to/file)(options)` options.
*/
export declare function FileRouteLoader<TFilePath extends keyof FileRoutesByPath, TRoute extends FileRoutesByPath[TFilePath]['preLoaderRoute']>(_path: TFilePath): <TLoaderFn>(loaderFn: Constrain<TLoaderFn, RouteLoaderFn<TRoute['parentRoute'], TRoute['types']['id'], TRoute['types']['params'], TRoute['types']['loaderDeps'], TRoute['types']['routerContext'], TRoute['types']['routeContextFn'], TRoute['types']['beforeLoadFn']>>) => TLoaderFn;
declare module '@tanstack/router-core' {
    interface LazyRoute<in out TRoute extends AnyRoute> {
        useMatch: UseMatchRoute<TRoute['id']>;
        useRouteContext: UseRouteContextRoute<TRoute['id']>;
        useSearch: UseSearchRoute<TRoute['id']>;
        useParams: UseParamsRoute<TRoute['id']>;
        useLoaderDeps: UseLoaderDepsRoute<TRoute['id']>;
        useLoaderData: UseLoaderDataRoute<TRoute['id']>;
        useNavigate: () => UseNavigateResult<TRoute['fullPath']>;
    }
}
export declare class LazyRoute<TRoute extends AnyRoute> {
    options: {
        id: string;
    } & LazyRouteOptions;
    constructor(opts: {
        id: string;
    } & LazyRouteOptions);
    useMatch: UseMatchRoute<TRoute['id']>;
    useRouteContext: UseRouteContextRoute<TRoute['id']>;
    useSearch: UseSearchRoute<TRoute['id']>;
    useParams: UseParamsRoute<TRoute['id']>;
    useLoaderDeps: UseLoaderDepsRoute<TRoute['id']>;
    useLoaderData: UseLoaderDataRoute<TRoute['id']>;
    useNavigate: () => UseNavigateResult<TRoute["fullPath"]>;
}
export declare function createLazyRoute<TRouter extends AnyRouter = RegisteredRouter, TId extends string = string, TRoute extends AnyRoute = RouteById<TRouter['routeTree'], TId>>(id: ConstrainLiteral<TId, RouteIds<TRouter['routeTree']>>): (opts: LazyRouteOptions) => LazyRoute<TRoute>;
export declare function createLazyFileRoute<TFilePath extends keyof FileRoutesByPath, TRoute extends FileRoutesByPath[TFilePath]['preLoaderRoute']>(id: TFilePath): (opts: LazyRouteOptions) => LazyRoute<TRoute>;
