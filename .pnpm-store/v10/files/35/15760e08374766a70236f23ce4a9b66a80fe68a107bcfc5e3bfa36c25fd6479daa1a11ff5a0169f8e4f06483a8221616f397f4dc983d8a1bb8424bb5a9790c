import * as React from 'react';
export declare function useStableCallback<T extends (...args: Array<any>) => any>(fn: T): T;
export declare const useLayoutEffect: typeof React.useEffect;
/**
 * Taken from https://www.developerway.com/posts/implementing-advanced-use-previous-hook#part3
 */
export declare function usePrevious<T>(value: T): T | null;
/**
 * React hook to wrap `IntersectionObserver`.
 *
 * This hook will create an `IntersectionObserver` and observe the ref passed to it.
 *
 * When the intersection changes, the callback will be called with the `IntersectionObserverEntry`.
 *
 * @param ref - The ref to observe
 * @param intersectionObserverOptions - The options to pass to the IntersectionObserver
 * @param options - The options to pass to the hook
 * @param callback - The callback to call when the intersection changes
 * @returns The IntersectionObserver instance
 * @example
 * ```tsx
 * const MyComponent = () => {
 * const ref = React.useRef<HTMLDivElement>(null)
 * useIntersectionObserver(
 *  ref,
 *  (entry) => { doSomething(entry) },
 *  { rootMargin: '10px' },
 *  { disabled: false }
 * )
 * return <div ref={ref} />
 * ```
 */
export declare function useIntersectionObserver<T extends Element>(ref: React.RefObject<T | null>, callback: (entry: IntersectionObserverEntry | undefined) => void, intersectionObserverOptions?: IntersectionObserverInit, options?: {
    disabled?: boolean;
}): void;
/**
 * React hook to take a `React.ForwardedRef` and returns a `ref` that can be used on a DOM element.
 *
 * @param ref - The forwarded ref
 * @returns The inner ref returned by `useRef`
 * @example
 * ```tsx
 * const MyComponent = React.forwardRef((props, ref) => {
 *  const innerRef = useForwardedRef(ref)
 *  return <div ref={innerRef} />
 * })
 * ```
 */
export declare function useForwardedRef<T>(ref?: React.ForwardedRef<T>): React.RefObject<T | null>;
