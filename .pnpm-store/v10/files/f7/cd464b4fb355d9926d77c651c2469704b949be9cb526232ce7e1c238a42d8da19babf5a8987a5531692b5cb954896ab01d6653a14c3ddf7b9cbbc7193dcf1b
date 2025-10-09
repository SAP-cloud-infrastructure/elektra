import { AnySchema } from './validators.cjs';
export declare const defaultParseSearch: (searchStr: string) => AnySchema;
export declare const defaultStringifySearch: (search: Record<string, any>) => string;
export declare function parseSearchWith(parser: (str: string) => any): (searchStr: string) => AnySchema;
export declare function stringifySearchWith(stringify: (search: any) => string, parser?: (str: string) => any): (search: Record<string, any>) => string;
export type SearchSerializer = (searchObj: Record<string, any>) => string;
export type SearchParser = (searchStr: string) => Record<string, any>;
