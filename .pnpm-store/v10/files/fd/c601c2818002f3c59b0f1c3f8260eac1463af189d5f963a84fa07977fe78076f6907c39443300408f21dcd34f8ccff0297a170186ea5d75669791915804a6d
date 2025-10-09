import type { Plugin, PluginAccessOptions, SerovalMode } from '../plugin';
import { SpecialReference } from '../special-reference';
import type { SerovalAsyncIteratorFactoryNode, SerovalIndexedValueNode, SerovalIteratorFactoryNode, SerovalMapNode, SerovalNode, SerovalNullConstructorNode, SerovalObjectNode, SerovalObjectRecordNode, SerovalPromiseConstructorNode, SerovalReferenceNode, SerovalSpecialReferenceNode, SerovalWKSymbolNode } from '../types';
export interface BaseParserContextOptions extends PluginAccessOptions {
    disabledFeatures?: number;
    refs?: Map<unknown, number>;
}
export declare const enum ParserNodeType {
    Fresh = 0,
    Indexed = 1,
    Referenced = 2
}
export interface FreshNode {
    type: ParserNodeType.Fresh;
    value: number;
}
export interface IndexedNode {
    type: ParserNodeType.Indexed;
    value: SerovalIndexedValueNode;
}
export interface ReferencedNode {
    type: ParserNodeType.Referenced;
    value: SerovalReferenceNode;
}
type ObjectNode = FreshNode | IndexedNode | ReferencedNode;
export declare abstract class BaseParserContext implements PluginAccessOptions {
    abstract readonly mode: SerovalMode;
    features: number;
    marked: Set<number>;
    refs: Map<unknown, number>;
    plugins?: Plugin<any, any>[] | undefined;
    constructor(options: BaseParserContextOptions);
    protected markRef(id: number): void;
    protected isMarked(id: number): boolean;
    protected createIndex<T>(current: T): number;
    protected getIndexedValue<T>(current: T): FreshNode | IndexedNode;
    protected getReference<T>(current: T): ObjectNode;
    protected parseWellKnownSymbol(current: symbol): SerovalIndexedValueNode | SerovalWKSymbolNode | SerovalReferenceNode;
    protected parseSpecialReference(ref: SpecialReference): SerovalIndexedValueNode | SerovalSpecialReferenceNode;
    protected parseIteratorFactory(): SerovalIndexedValueNode | SerovalIteratorFactoryNode;
    protected parseAsyncIteratorFactory(): SerovalIndexedValueNode | SerovalAsyncIteratorFactoryNode;
    protected createObjectNode(id: number, current: Record<string, unknown>, empty: boolean, record: SerovalObjectRecordNode): SerovalObjectNode | SerovalNullConstructorNode;
    protected createMapNode(id: number, k: SerovalNode[], v: SerovalNode[], s: number): SerovalMapNode;
    protected createPromiseConstructorNode(id: number, resolver: number): SerovalPromiseConstructorNode;
}
export {};
//# sourceMappingURL=parser.d.ts.map