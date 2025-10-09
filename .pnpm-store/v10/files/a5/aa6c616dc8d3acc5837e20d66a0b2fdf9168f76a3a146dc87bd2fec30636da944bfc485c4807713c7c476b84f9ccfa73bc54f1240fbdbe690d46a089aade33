import { AsyncRouteComponent } from './route.cjs';
export declare function lazyRouteComponent<T extends Record<string, any>, TKey extends keyof T = 'default'>(importer: () => Promise<T>, exportName?: TKey): T[TKey] extends (props: infer TProps) => any ? AsyncRouteComponent<TProps> : never;
