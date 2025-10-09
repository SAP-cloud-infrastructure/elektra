import { StructuralSharingOption, ValidateSelected } from './structuralSharing.cjs';
import { AnyRouter, RegisteredRouter, ResolveUseLoaderDeps, StrictOrFrom, UseLoaderDepsResult } from '@tanstack/router-core';
export interface UseLoaderDepsBaseOptions<TRouter extends AnyRouter, TFrom, TSelected, TStructuralSharing> {
    select?: (deps: ResolveUseLoaderDeps<TRouter, TFrom>) => ValidateSelected<TRouter, TSelected, TStructuralSharing>;
}
export type UseLoaderDepsOptions<TRouter extends AnyRouter, TFrom extends string | undefined, TSelected, TStructuralSharing> = StrictOrFrom<TRouter, TFrom> & UseLoaderDepsBaseOptions<TRouter, TFrom, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, TStructuralSharing>;
export type UseLoaderDepsRoute<out TId> = <TRouter extends AnyRouter = RegisteredRouter, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts?: UseLoaderDepsBaseOptions<TRouter, TId, TSelected, TStructuralSharing> & StructuralSharingOption<TRouter, TSelected, false>) => UseLoaderDepsResult<TRouter, TId, TSelected>;
export declare function useLoaderDeps<TRouter extends AnyRouter = RegisteredRouter, const TFrom extends string | undefined = undefined, TSelected = unknown, TStructuralSharing extends boolean = boolean>(opts: UseLoaderDepsOptions<TRouter, TFrom, TSelected, TStructuralSharing>): UseLoaderDepsResult<TRouter, TFrom, TSelected>;
