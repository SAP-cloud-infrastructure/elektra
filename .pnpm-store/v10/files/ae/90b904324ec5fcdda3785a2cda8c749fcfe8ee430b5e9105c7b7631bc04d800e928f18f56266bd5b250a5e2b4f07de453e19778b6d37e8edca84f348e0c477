import type { Stream } from '../../stream';
import type { SerovalNode, SerovalObjectRecordNode, SerovalPluginNode, SerovalPromiseConstructorNode } from '../../types';
import type { BaseSyncParserContextOptions } from './sync';
import BaseSyncParserContext from './sync';
export interface BaseStreamParserContextOptions extends BaseSyncParserContextOptions {
    onParse: (node: SerovalNode, initial: boolean) => void;
    onError?: (error: unknown) => void;
    onDone?: () => void;
}
export default abstract class BaseStreamParserContext extends BaseSyncParserContext {
    private alive;
    private pending;
    private onParseCallback;
    private onErrorCallback?;
    private onDoneCallback?;
    constructor(options: BaseStreamParserContextOptions);
    private initial;
    private buffer;
    private onParseInternal;
    private flush;
    onParse(node: SerovalNode): void;
    onError(error: unknown): void;
    private onDone;
    pushPendingState(): void;
    popPendingState(): void;
    protected parseProperties(properties: Record<string | symbol, unknown>): SerovalObjectRecordNode;
    protected handlePromiseSuccess(id: number, data: unknown): void;
    protected handlePromiseFailure(id: number, data: unknown): void;
    protected parsePromise(id: number, current: Promise<unknown>): SerovalPromiseConstructorNode;
    protected parsePlugin(id: number, current: unknown): SerovalPluginNode | undefined;
    protected parseStream(id: number, current: Stream<unknown>): SerovalNode;
    parseWithError<T>(current: T): SerovalNode | undefined;
    /**
     * @private
     */
    start<T>(current: T): void;
    /**
     * @private
     */
    destroy(): void;
    isAlive(): boolean;
}
//# sourceMappingURL=stream.d.ts.map