import { GeneratorOptions, GeneratorResult } from '@babel/generator';
import { ParseResult, ParserOptions } from '@babel/parser';
import type * as _babel_types from '@babel/types';
export type ParseAstOptions = ParserOptions & {
    code: string;
};
export declare function parseAst({ code, ...opts }: ParseAstOptions): ParseResult<_babel_types.File>;
type GenerateFromAstOptions = GeneratorOptions & Required<Pick<GeneratorOptions, 'sourceFileName' | 'filename'>>;
export declare function generateFromAst(ast: _babel_types.Node, opts?: GenerateFromAstOptions): GeneratorResult;
export type { GeneratorResult } from '@babel/generator';
