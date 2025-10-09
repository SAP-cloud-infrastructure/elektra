import { RouteById } from './routeInfo.js';
import { AnyRouter } from './router.js';
import { Expand } from './utils.js';
export type ResolveUseLoaderDeps<TRouter extends AnyRouter, TFrom> = Expand<RouteById<TRouter['routeTree'], TFrom>['types']['loaderDeps']>;
export type UseLoaderDepsResult<TRouter extends AnyRouter, TFrom, TSelected> = unknown extends TSelected ? ResolveUseLoaderDeps<TRouter, TFrom> : TSelected;
