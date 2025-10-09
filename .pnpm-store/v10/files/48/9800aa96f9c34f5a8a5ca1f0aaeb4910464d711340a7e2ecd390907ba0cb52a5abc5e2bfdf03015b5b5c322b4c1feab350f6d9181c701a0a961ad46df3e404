import { AnyRouter, Constrain, LinkOptions, RegisteredRouter, RoutePaths } from '@tanstack/router-core';
import { ReactNode } from 'react';
import { ValidateLinkOptions, ValidateLinkOptionsArray } from './typePrimitives.js';
import * as React from 'react';
export declare function useLinkProps<TRouter extends AnyRouter = RegisteredRouter, const TFrom extends string = string, const TTo extends string | undefined = undefined, const TMaskFrom extends string = TFrom, const TMaskTo extends string = ''>(options: UseLinkPropsOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>, forwardedRef?: React.ForwardedRef<Element>): React.ComponentPropsWithRef<'a'>;
type UseLinkReactProps<TComp> = TComp extends keyof React.JSX.IntrinsicElements ? React.JSX.IntrinsicElements[TComp] : TComp extends React.ComponentType<any> ? React.ComponentPropsWithoutRef<TComp> & React.RefAttributes<React.ComponentRef<TComp>> : never;
export type UseLinkPropsOptions<TRouter extends AnyRouter = RegisteredRouter, TFrom extends RoutePaths<TRouter['routeTree']> | string = string, TTo extends string | undefined = '.', TMaskFrom extends RoutePaths<TRouter['routeTree']> | string = TFrom, TMaskTo extends string = '.'> = ActiveLinkOptions<'a', TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & UseLinkReactProps<'a'>;
export type ActiveLinkOptions<TComp = 'a', TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = '.', TMaskFrom extends string = TFrom, TMaskTo extends string = '.'> = LinkOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & ActiveLinkOptionProps<TComp>;
type ActiveLinkProps<TComp> = Partial<LinkComponentReactProps<TComp> & {
    [key: `data-${string}`]: unknown;
}>;
export interface ActiveLinkOptionProps<TComp = 'a'> {
    /**
     * A function that returns additional props for the `active` state of this link.
     * These props override other props passed to the link (`style`'s are merged, `className`'s are concatenated)
     */
    activeProps?: ActiveLinkProps<TComp> | (() => ActiveLinkProps<TComp>);
    /**
     * A function that returns additional props for the `inactive` state of this link.
     * These props override other props passed to the link (`style`'s are merged, `className`'s are concatenated)
     */
    inactiveProps?: ActiveLinkProps<TComp> | (() => ActiveLinkProps<TComp>);
}
export type LinkProps<TComp = 'a', TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = '.', TMaskFrom extends string = TFrom, TMaskTo extends string = '.'> = ActiveLinkOptions<TComp, TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & LinkPropsChildren;
export interface LinkPropsChildren {
    children?: React.ReactNode | ((state: {
        isActive: boolean;
        isTransitioning: boolean;
    }) => React.ReactNode);
}
type LinkComponentReactProps<TComp> = Omit<UseLinkReactProps<TComp>, keyof CreateLinkProps>;
export type LinkComponentProps<TComp = 'a', TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = '.', TMaskFrom extends string = TFrom, TMaskTo extends string = '.'> = LinkComponentReactProps<TComp> & LinkProps<TComp, TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;
export type CreateLinkProps = LinkProps<any, any, string, string, string, string>;
export type LinkComponent<in out TComp, in out TDefaultFrom extends string = string> = <TRouter extends AnyRouter = RegisteredRouter, const TFrom extends string = TDefaultFrom, const TTo extends string | undefined = undefined, const TMaskFrom extends string = TFrom, const TMaskTo extends string = ''>(props: LinkComponentProps<TComp, TRouter, TFrom, TTo, TMaskFrom, TMaskTo>) => React.ReactElement;
export interface LinkComponentRoute<in out TDefaultFrom extends string = string> {
    defaultFrom: TDefaultFrom;
    <TRouter extends AnyRouter = RegisteredRouter, const TTo extends string | undefined = undefined, const TMaskTo extends string = ''>(props: LinkComponentProps<'a', TRouter, this['defaultFrom'], TTo, this['defaultFrom'], TMaskTo>): React.ReactElement;
}
export declare function createLink<const TComp>(Comp: Constrain<TComp, any, (props: CreateLinkProps) => ReactNode>): LinkComponent<TComp>;
export declare const Link: LinkComponent<'a'>;
export type LinkOptionsFnOptions<TOptions, TComp, TRouter extends AnyRouter = RegisteredRouter> = TOptions extends ReadonlyArray<any> ? ValidateLinkOptionsArray<TRouter, TOptions, string, TComp> : ValidateLinkOptions<TRouter, TOptions, string, TComp>;
export type LinkOptionsFn<TComp> = <const TOptions, TRouter extends AnyRouter = RegisteredRouter>(options: LinkOptionsFnOptions<TOptions, TComp, TRouter>) => TOptions;
export declare const linkOptions: LinkOptionsFn<'a'>;
export {};
