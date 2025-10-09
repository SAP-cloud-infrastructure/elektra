import { AnyRouter, RegisteredRouter, RouterOptions } from '@tanstack/router-core';
import * as React from 'react';
export declare function RouterContextProvider<TRouter extends AnyRouter = RegisteredRouter, TDehydrated extends Record<string, any> = Record<string, any>>({ router, children, ...rest }: RouterProps<TRouter, TDehydrated> & {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function RouterProvider<TRouter extends AnyRouter = RegisteredRouter, TDehydrated extends Record<string, any> = Record<string, any>>({ router, ...rest }: RouterProps<TRouter, TDehydrated>): import("react/jsx-runtime").JSX.Element;
export type RouterProps<TRouter extends AnyRouter = RegisteredRouter, TDehydrated extends Record<string, any> = Record<string, any>> = Omit<RouterOptions<TRouter['routeTree'], NonNullable<TRouter['options']['trailingSlash']>, NonNullable<TRouter['options']['defaultStructuralSharing']>, TRouter['history'], TDehydrated>, 'context'> & {
    router: TRouter;
    context?: Partial<RouterOptions<TRouter['routeTree'], NonNullable<TRouter['options']['trailingSlash']>, NonNullable<TRouter['options']['defaultStructuralSharing']>, TRouter['history'], TDehydrated>['context']>;
};
