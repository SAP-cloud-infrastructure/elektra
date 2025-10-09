import { StructuralSharingOption, ValidateSelected } from './structuralSharing.cjs';
import { AnyRouter, RegisteredRouter, RouterState } from '@tanstack/router-core';
export interface UseLocationBaseOptions<TRouter extends AnyRouter, TSelected, TStructuralSharing extends boolean = boolean> {
    select?: (state: RouterState<TRouter['routeTree']>['location']) => ValidateSelected<TRouter, TSelected, TStructuralSharing>;
}
export type UseLocationResult<TRouter extends AnyRouter, TSelected> = unknown extends TSelected ? RouterState<TRouter['routeTree']>['location'] : TSelected;
export declare function useLocation<TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseLocationBaseOptions<TRouter, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>): UseLocationResult<TRouter, TSelected>;
