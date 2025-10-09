import { NoInfer, PickOptional } from './utils.js';
import { SearchMiddleware } from './route.js';
import { IsRequiredParams } from './link.js';
export declare function retainSearchParams<TSearchSchema extends object>(keys: Array<keyof TSearchSchema> | true): SearchMiddleware<TSearchSchema>;
export declare function stripSearchParams<TSearchSchema, TOptionalProps = PickOptional<NoInfer<TSearchSchema>>, const TValues = Partial<NoInfer<TOptionalProps>> | Array<keyof TOptionalProps>, const TInput = IsRequiredParams<TSearchSchema> extends never ? TValues | true : TValues>(input: NoInfer<TInput>): SearchMiddleware<TSearchSchema>;
