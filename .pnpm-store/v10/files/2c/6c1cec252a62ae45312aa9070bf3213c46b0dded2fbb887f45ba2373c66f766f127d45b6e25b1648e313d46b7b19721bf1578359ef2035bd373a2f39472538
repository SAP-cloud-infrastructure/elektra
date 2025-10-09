import { LRUCache } from './lru-cache.js';
import { MatchLocation } from './RouterProvider.js';
import { AnyPathParams } from './route.js';
export declare const SEGMENT_TYPE_PATHNAME = 0;
export declare const SEGMENT_TYPE_PARAM = 1;
export declare const SEGMENT_TYPE_WILDCARD = 2;
export declare const SEGMENT_TYPE_OPTIONAL_PARAM = 3;
export interface Segment {
    readonly type: typeof SEGMENT_TYPE_PATHNAME | typeof SEGMENT_TYPE_PARAM | typeof SEGMENT_TYPE_WILDCARD | typeof SEGMENT_TYPE_OPTIONAL_PARAM;
    readonly value: string;
    readonly prefixSegment?: string;
    readonly suffixSegment?: string;
    readonly hasStaticAfter?: boolean;
}
export declare function joinPaths(paths: Array<string | undefined>): string;
export declare function cleanPath(path: string): string;
export declare function trimPathLeft(path: string): string;
export declare function trimPathRight(path: string): string;
export declare function trimPath(path: string): string;
export declare function removeTrailingSlash(value: string, basepath: string): string;
export declare function exactPathTest(pathName1: string, pathName2: string, basepath: string): boolean;
interface ResolvePathOptions {
    basepath: string;
    base: string;
    to: string;
    trailingSlash?: 'always' | 'never' | 'preserve';
    caseSensitive?: boolean;
    parseCache?: ParsePathnameCache;
}
export declare function resolvePath({ basepath, base, to, trailingSlash, caseSensitive, parseCache, }: ResolvePathOptions): string;
export type ParsePathnameCache = LRUCache<string, ReadonlyArray<Segment>>;
export declare const parsePathname: (pathname?: string, cache?: ParsePathnameCache) => ReadonlyArray<Segment>;
interface InterpolatePathOptions {
    path?: string;
    params: Record<string, unknown>;
    leaveWildcards?: boolean;
    leaveParams?: boolean;
    decodeCharMap?: Map<string, string>;
    parseCache?: ParsePathnameCache;
}
type InterPolatePathResult = {
    interpolatedPath: string;
    usedParams: Record<string, unknown>;
    isMissingParams: boolean;
};
export declare function interpolatePath({ path, params, leaveWildcards, leaveParams, decodeCharMap, parseCache, }: InterpolatePathOptions): InterPolatePathResult;
export declare function matchPathname(basepath: string, currentPathname: string, matchLocation: Pick<MatchLocation, 'to' | 'fuzzy' | 'caseSensitive'>, parseCache?: ParsePathnameCache): AnyPathParams | undefined;
export declare function removeBasepath(basepath: string, pathname: string, caseSensitive?: boolean): string;
export declare function matchByPath(basepath: string, from: string, { to, fuzzy, caseSensitive, }: Pick<MatchLocation, 'to' | 'caseSensitive' | 'fuzzy'>, parseCache?: ParsePathnameCache): Record<string, string> | undefined;
export {};
