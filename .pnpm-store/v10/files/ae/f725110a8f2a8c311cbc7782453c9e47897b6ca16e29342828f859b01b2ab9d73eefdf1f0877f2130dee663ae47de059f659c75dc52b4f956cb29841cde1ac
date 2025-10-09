import { HistoryAction } from '@tanstack/history';
import { AnyRoute, AnyRouter, ParseRoute, RegisteredRouter } from '@tanstack/router-core';
import * as React from 'react';
interface ShouldBlockFnLocation<out TRouteId, out TFullPath, out TAllParams, out TFullSearchSchema> {
    routeId: TRouteId;
    fullPath: TFullPath;
    pathname: string;
    params: TAllParams;
    search: TFullSearchSchema;
}
type MakeShouldBlockFnLocationUnion<TRouter extends AnyRouter = RegisteredRouter, TRoute extends AnyRoute = ParseRoute<TRouter['routeTree']>> = TRoute extends any ? ShouldBlockFnLocation<TRoute['id'], TRoute['fullPath'], TRoute['types']['allParams'], TRoute['types']['fullSearchSchema']> : never;
type BlockerResolver<TRouter extends AnyRouter = RegisteredRouter> = {
    status: 'blocked';
    current: MakeShouldBlockFnLocationUnion<TRouter>;
    next: MakeShouldBlockFnLocationUnion<TRouter>;
    action: HistoryAction;
    proceed: () => void;
    reset: () => void;
} | {
    status: 'idle';
    current: undefined;
    next: undefined;
    action: undefined;
    proceed: undefined;
    reset: undefined;
};
type ShouldBlockFnArgs<TRouter extends AnyRouter = RegisteredRouter> = {
    current: MakeShouldBlockFnLocationUnion<TRouter>;
    next: MakeShouldBlockFnLocationUnion<TRouter>;
    action: HistoryAction;
};
export type ShouldBlockFn<TRouter extends AnyRouter = RegisteredRouter> = (args: ShouldBlockFnArgs<TRouter>) => boolean | Promise<boolean>;
export type UseBlockerOpts<TRouter extends AnyRouter = RegisteredRouter, TWithResolver extends boolean = boolean> = {
    shouldBlockFn: ShouldBlockFn<TRouter>;
    enableBeforeUnload?: boolean | (() => boolean);
    disabled?: boolean;
    withResolver?: TWithResolver;
};
type LegacyBlockerFn = () => Promise<any> | any;
type LegacyBlockerOpts = {
    blockerFn?: LegacyBlockerFn;
    condition?: boolean | any;
};
export declare function useBlocker<TRouter extends AnyRouter = RegisteredRouter, TWithResolver extends boolean = false>(opts: UseBlockerOpts<TRouter, TWithResolver>): TWithResolver extends true ? BlockerResolver<TRouter> : void;
/**
 * @deprecated Use the shouldBlockFn property instead
 */
export declare function useBlocker(blockerFnOrOpts?: LegacyBlockerOpts): BlockerResolver;
/**
 * @deprecated Use the UseBlockerOpts object syntax instead
 */
export declare function useBlocker(blockerFn?: LegacyBlockerFn, condition?: boolean | any): BlockerResolver;
export declare function Block<TRouter extends AnyRouter = RegisteredRouter, TWithResolver extends boolean = boolean>(opts: PromptProps<TRouter, TWithResolver>): React.ReactNode;
/**
 *  @deprecated Use the UseBlockerOpts property instead
 */
export declare function Block(opts: LegacyPromptProps): React.ReactNode;
type LegacyPromptProps = {
    blockerFn?: LegacyBlockerFn;
    condition?: boolean | any;
    children?: React.ReactNode | ((params: BlockerResolver) => React.ReactNode);
};
type PromptProps<TRouter extends AnyRouter = RegisteredRouter, TWithResolver extends boolean = boolean, TParams = TWithResolver extends true ? BlockerResolver<TRouter> : void> = UseBlockerOpts<TRouter, TWithResolver> & {
    children?: React.ReactNode | ((params: TParams) => React.ReactNode);
};
export {};
