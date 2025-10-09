import { StructuralSharingOption, ValidateSelected } from './structuralSharing.cjs';
import { AnyRouter, DeepPartial, Expand, MakeOptionalPathParams, MakeOptionalSearchParams, MakeRouteMatchUnion, MaskOptions, MatchRouteOptions, NoInfer, RegisteredRouter, ResolveRelativePath, ResolveRoute, RouteByPath, ToSubOptionsProps } from '@tanstack/router-core';
import * as React from 'react';
declare module '@tanstack/router-core' {
    interface RouteMatchExtensions {
        meta?: Array<React.JSX.IntrinsicElements['meta'] | undefined>;
        links?: Array<React.JSX.IntrinsicElements['link'] | undefined>;
        scripts?: Array<React.JSX.IntrinsicElements['script'] | undefined>;
        styles?: Array<React.JSX.IntrinsicElements['style'] | undefined>;
        headScripts?: Array<React.JSX.IntrinsicElements['script'] | undefined>;
    }
}
export declare function Matches(): import("react/jsx-runtime").JSX.Element;
export type UseMatchRouteOptions<TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = undefined, TMaskFrom extends string = TFrom, TMaskTo extends string = ''> = ToSubOptionsProps<TRouter, TFrom, TTo> & DeepPartial<MakeOptionalSearchParams<TRouter, TFrom, TTo>> & DeepPartial<MakeOptionalPathParams<TRouter, TFrom, TTo>> & MaskOptions<TRouter, TMaskFrom, TMaskTo> & MatchRouteOptions;
export declare function useMatchRoute<TRouter extends AnyRouter = RegisteredRouter>(): <const TFrom extends string = string, const TTo extends string | undefined = undefined, const TMaskFrom extends string = TFrom, const TMaskTo extends string = "">(opts: UseMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>) => false | Expand<ResolveRoute<TRouter, TFrom, TTo>["types"]["allParams"]>;
export type MakeMatchRouteOptions<TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = undefined, TMaskFrom extends string = TFrom, TMaskTo extends string = ''> = UseMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & {
    children?: ((params?: RouteByPath<TRouter['routeTree'], ResolveRelativePath<TFrom, NoInfer<TTo>>>['types']['allParams']) => React.ReactNode) | React.ReactNode;
};
export declare function MatchRoute<TRouter extends AnyRouter = RegisteredRouter, const TFrom extends string = string, const TTo extends string | undefined = undefined, const TMaskFrom extends string = TFrom, const TMaskTo extends string = ''>(props: MakeMatchRouteOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>): any;
export interface UseMatchesBaseOptions<TRouter extends AnyRouter, TSelected, TStructuralSharing> {
    select?: (matches: Array<MakeRouteMatchUnion<TRouter>>) => ValidateSelected<TRouter, TSelected, TStructuralSharing>;
}
export type UseMatchesResult<TRouter extends AnyRouter, TSelected> = unknown extends TSelected ? Array<MakeRouteMatchUnion<TRouter>> : TSelected;
export declare function useMatches<TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseMatchesBaseOptions<TRouter, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>): UseMatchesResult<TRouter, TSelected>;
export declare function useParentMatches<TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseMatchesBaseOptions<TRouter, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>): UseMatchesResult<TRouter, TSelected>;
export declare function useChildMatches<TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseMatchesBaseOptions<TRouter, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>): UseMatchesResult<TRouter, TSelected>;
