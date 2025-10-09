import { DeferredPromise } from '@tanstack/router-core';
import * as React from 'react';
export type AwaitOptions<T> = {
    promise: Promise<T>;
};
export declare function useAwaited<T>({ promise: _promise, }: AwaitOptions<T>): [T, DeferredPromise<T>];
export declare function Await<T>(props: AwaitOptions<T> & {
    fallback?: React.ReactNode;
    children: (result: T) => React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
