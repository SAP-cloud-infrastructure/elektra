import { ImportDeclaration } from '../types.cjs';
import { types } from 'recast';
import { Config } from '../config.cjs';
export interface TransformOptions {
    source: string;
    ctx: TransformContext;
    plugins?: Array<TransformPlugin>;
}
export type TransformResult = {
    result: 'not-modified';
    exports: Array<string>;
} | {
    result: 'modified';
    output: string;
    exports: Array<string>;
} | {
    result: 'error';
    error?: any;
};
export interface TransformImportsConfig {
    banned?: Array<ImportDeclaration>;
    required?: Array<ImportDeclaration>;
}
export interface TransformPlugin {
    name: string;
    exportName: string;
    imports: (ctx: TransformContext) => TransformImportsConfig;
    /**
     * Called after the export is found in the AST.
     * @returns true if the plugin modified the AST, false otherwise
     */
    onExportFound: (opts: {
        decl: types.namedTypes.VariableDeclarator;
        ctx: TransformContext;
    }) => boolean;
}
export interface TransformContext {
    target: Config['target'];
    routeId: string;
    lazy: boolean;
    verboseFileRoutes: boolean;
    preferredQuote?: '"' | "'";
}
