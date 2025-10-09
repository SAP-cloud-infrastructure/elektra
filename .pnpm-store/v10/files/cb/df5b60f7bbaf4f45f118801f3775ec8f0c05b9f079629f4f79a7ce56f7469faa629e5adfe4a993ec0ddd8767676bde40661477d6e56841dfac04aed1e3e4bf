import { AllLoaderData, RouteById } from './routeInfo.cjs';
import { AnyRouter } from './router.cjs';
import { Expand } from './utils.cjs';
export type ResolveUseLoaderData<TRouter extends AnyRouter, TFrom, TStrict extends boolean> = TStrict extends false ? AllLoaderData<TRouter['routeTree']> : Expand<RouteById<TRouter['routeTree'], TFrom>['types']['loaderData']>;
export type UseLoaderDataResult<TRouter extends AnyRouter, TFrom, TStrict extends boolean, TSelected> = unknown extends TSelected ? ResolveUseLoaderData<TRouter, TFrom, TStrict> : TSelected;
