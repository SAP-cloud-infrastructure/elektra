import { StructuralSharingOption, ValidateSelected } from './structuralSharing.cjs';
import { AnyRouter, RegisteredRouter, ResolveUseParams, StrictOrFrom, ThrowConstraint, ThrowOrOptional, UseParamsResult } from '@tanstack/router-core';
export interface UseParamsBaseOptions<TRouter extends AnyRouter, TFrom, TStrict extends boolean, TThrow extends boolean, TSelected, TStructuralSharing> {
    select?: (params: ResolveUseParams<TRouter, TFrom, TStrict>) => ValidateSelected<TRouter, TSelected, TStructuralSharing>;
    shouldThrow?: TThrow;
}
export type UseParamsOptions<TRouter extends AnyRouter, TFrom extends string | undefined, TStrict extends boolean, TThrow extends boolean, TSelected, TStructuralSharing> = StrictOrFrom<TRouter, TFrom, TStrict> & UseParamsBaseOptions<TRouter, TFrom, TStrict, TThrow, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>;
export type UseParamsRoute<out TFrom> = <TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseParamsBaseOptions<TRouter, TFrom, true, true, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>) => UseParamsResult<TRouter, TFrom, true, TSelected>;
export declare function useParams<TRouter extends AnyRouter = RegisteredRouter, const TFrom extends string | undefined = undefined, TStrict extends boolean = true, TThrow extends boolean = true, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts: UseParamsOptions<TRouter, TFrom, TStrict, ThrowConstraint<TStrict, TThrow>, TSelected, TStructuralSharing>): ThrowOrOptional<UseParamsResult<TRouter, TFrom, TStrict, TSelected>, TThrow>;
