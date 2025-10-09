import { AnyRouter, Constrain, InferFrom, InferMaskFrom, InferMaskTo, InferSelected, InferShouldThrow, InferStrict, InferTo, RegisteredRouter } from '@tanstack/router-core';
import { LinkComponentProps } from './link.cjs';
import { UseParamsOptions } from './useParams.cjs';
import { UseSearchOptions } from './useSearch.cjs';
export type ValidateLinkOptions<TRouter extends AnyRouter = RegisteredRouter, TOptions = unknown, TDefaultFrom extends string = string, TComp = 'a'> = Constrain<TOptions, LinkComponentProps<TComp, TRouter, InferFrom<TOptions, TDefaultFrom>, InferTo<TOptions>, InferMaskFrom<TOptions>, InferMaskTo<TOptions>>>;
export type ValidateUseSearchOptions<TOptions, TRouter extends AnyRouter = RegisteredRouter> = Constrain<TOptions, UseSearchOptions<TRouter, InferFrom<TOptions>, InferStrict<TOptions>, InferShouldThrow<TOptions>, InferSelected<TOptions>, InferStructuralSharing<TOptions>>>;
export type ValidateUseParamsOptions<TOptions, TRouter extends AnyRouter = RegisteredRouter> = Constrain<TOptions, UseParamsOptions<TRouter, InferFrom<TOptions>, InferStrict<TOptions>, InferShouldThrow<TOptions>, InferSelected<TOptions>, InferSelected<TOptions>>>;
export type ValidateLinkOptionsArray<TRouter extends AnyRouter = RegisteredRouter, TOptions extends ReadonlyArray<any> = ReadonlyArray<unknown>, TDefaultFrom extends string = string, TComp = 'a'> = {
    [K in keyof TOptions]: ValidateLinkOptions<TRouter, TOptions[K], TDefaultFrom, TComp>;
};
