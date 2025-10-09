import { StructuralSharingOption, ValidateSelected } from './structuralSharing.js';
import { AnyRouter, RegisteredRouter, ResolveUseSearch, StrictOrFrom, ThrowConstraint, ThrowOrOptional, UseSearchResult } from '@tanstack/router-core';
export interface UseSearchBaseOptions<TRouter extends AnyRouter, TFrom, TStrict extends boolean, TThrow extends boolean, TSelected, TStructuralSharing> {
    select?: (state: ResolveUseSearch<TRouter, TFrom, TStrict>) => ValidateSelected<TRouter, TSelected, TStructuralSharing>;
    shouldThrow?: TThrow;
}
export type UseSearchOptions<TRouter extends AnyRouter, TFrom, TStrict extends boolean, TThrow extends boolean, TSelected, TStructuralSharing> = StrictOrFrom<TRouter, TFrom, TStrict> & UseSearchBaseOptions<TRouter, TFrom, TStrict, TThrow, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>;
export type UseSearchRoute<out TFrom> = <TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseSearchBaseOptions<TRouter, TFrom, true, true, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>) => UseSearchResult<TRouter, TFrom, true, TSelected>;
export declare function useSearch<TRouter extends AnyRouter = RegisteredRouter, const TFrom extends string | undefined = undefined, TStrict extends boolean = true, TThrow extends boolean = true, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts: UseSearchOptions<TRouter, TFrom, TStrict, ThrowConstraint<TStrict, TThrow>, TSelected, TStructuralSharing>): ThrowOrOptional<UseSearchResult<TRouter, TFrom, TStrict, TSelected>, TThrow>;
