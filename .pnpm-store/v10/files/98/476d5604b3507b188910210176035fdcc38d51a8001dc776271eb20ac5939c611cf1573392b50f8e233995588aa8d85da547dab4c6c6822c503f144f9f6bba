import { FullSearchSchema, RouteById } from './routeInfo.cjs';
import { AnyRouter } from './router.cjs';
import { Expand } from './utils.cjs';
export type UseSearchResult<TRouter extends AnyRouter, TFrom, TStrict extends boolean, TSelected> = unknown extends TSelected ? ResolveUseSearch<TRouter, TFrom, TStrict> : TSelected;
export type ResolveUseSearch<TRouter extends AnyRouter, TFrom, TStrict extends boolean> = TStrict extends false ? FullSearchSchema<TRouter['routeTree']> : Expand<RouteById<TRouter['routeTree'], TFrom>['types']['fullSearchSchema']>;
