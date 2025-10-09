import { GeneratorResult, ParseAstOptions } from '@tanstack/router-utils';
import { CodeSplitGroupings, SplitRouteIdentNodes } from '../constants.cjs';
import { Config, DeletableNodes } from '../config.cjs';
export declare function compileCodeSplitReferenceRoute(opts: ParseAstOptions & {
    codeSplitGroupings: CodeSplitGroupings;
    deleteNodes?: Set<DeletableNodes>;
    targetFramework: Config['target'];
    filename: string;
    id: string;
    addHmr?: boolean;
}): GeneratorResult;
export declare function compileCodeSplitVirtualRoute(opts: ParseAstOptions & {
    splitTargets: Array<SplitRouteIdentNodes>;
    filename: string;
}): GeneratorResult;
/**
 * This function should read get the options from by searching for the key `codeSplitGroupings`
 * on createFileRoute and return it's values if it exists, else return undefined
 */
export declare function detectCodeSplitGroupingsFromRoute(opts: ParseAstOptions): {
    groupings: CodeSplitGroupings | undefined;
};
