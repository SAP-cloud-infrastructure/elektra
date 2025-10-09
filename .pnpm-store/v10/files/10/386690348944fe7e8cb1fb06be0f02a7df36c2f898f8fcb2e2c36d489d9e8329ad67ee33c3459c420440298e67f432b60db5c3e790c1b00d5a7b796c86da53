import type { SerovalNode } from 'seroval';
export declare function abortSignalToPromise(signal: AbortSignal): Promise<any>;
declare const enum AbortSignalState {
    Pending = 0,
    Aborted = 1,
    Streaming = 2
}
type AbortSignalNode = {
    type: AbortSignalState.Pending;
} | {
    type: AbortSignalState.Aborted;
    reason: SerovalNode;
} | {
    type: AbortSignalState.Streaming;
    controller: SerovalNode;
};
declare const AbortSignalPlugin: import("seroval").Plugin<AbortSignal, AbortSignalNode>;
export default AbortSignalPlugin;
//# sourceMappingURL=abort-signal.d.ts.map