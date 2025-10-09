import { defaultSerializeError } from './router.cjs';
export declare const TSR_DEFERRED_PROMISE: unique symbol;
export type DeferredPromiseState<T> = {
    status: 'pending';
    data?: T;
    error?: unknown;
} | {
    status: 'success';
    data: T;
} | {
    status: 'error';
    data?: T;
    error: unknown;
};
export type DeferredPromise<T> = Promise<T> & {
    [TSR_DEFERRED_PROMISE]: DeferredPromiseState<T>;
};
export declare function defer<T>(_promise: Promise<T>, options?: {
    serializeError?: typeof defaultSerializeError;
}): DeferredPromise<T>;
