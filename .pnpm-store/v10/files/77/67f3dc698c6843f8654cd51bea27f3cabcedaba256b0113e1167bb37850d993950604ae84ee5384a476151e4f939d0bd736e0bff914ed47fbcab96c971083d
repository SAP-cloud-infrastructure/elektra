import { RouteById } from './routeInfo.cjs';
import { AnyRouter } from './router.cjs';
import { Expand } from './utils.cjs';
export type ResolveUseLoaderDeps<TRouter extends AnyRouter, TFrom> = Expand<RouteById<TRouter['routeTree'], TFrom>['types']['loaderDeps']>;
export type UseLoaderDepsResult<TRouter extends AnyRouter, TFrom, TSelected> = unknown extends TSelected ? ResolveUseLoaderDeps<TRouter, TFrom> : TSelected;
