import { NoInfer, PickOptional } from './utils.cjs';
import { SearchMiddleware } from './route.cjs';
import { IsRequiredParams } from './link.cjs';
export declare function retainSearchParams<TSearchSchema extends object>(keys: Array<keyof TSearchSchema> | true): SearchMiddleware<TSearchSchema>;
export declare function stripSearchParams<TSearchSchema, TOptionalProps = PickOptional<NoInfer<TSearchSchema>>, const TValues = Partial<NoInfer<TOptionalProps>> | Array<keyof TOptionalProps>, const TInput = IsRequiredParams<TSearchSchema> extends never ? TValues | true : TValues>(input: NoInfer<TInput>): SearchMiddleware<TSearchSchema>;
