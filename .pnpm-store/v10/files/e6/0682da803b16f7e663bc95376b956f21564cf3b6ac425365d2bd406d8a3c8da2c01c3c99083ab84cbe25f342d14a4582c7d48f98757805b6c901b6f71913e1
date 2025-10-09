import { AnyRouter, RegisteredRouter, RouterState } from '@tanstack/router-core';
import { StructuralSharingOption, ValidateSelected } from './structuralSharing.cjs';
export type UseRouterStateOptions<TRouter extends AnyRouter, TSelected, TStructuralSharing> = {
    router?: TRouter;
    select?: (state: RouterState<TRouter['routeTree']>) => ValidateSelected<TRouter, TSelected, TStructuralSharing>;
} & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>;
export type UseRouterStateResult<TRouter extends AnyRouter, TSelected> = unknown extends TSelected ? RouterState<TRouter['routeTree']> : TSelected;
export declare function useRouterState<TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseRouterStateOptions<TRouter, TSelected, TStructuralSharing>): UseRouterStateResult<TRouter, TSelected>;
