import { NavigateOptions } from './link.js';
import { AnyRouter, RegisteredRouter } from './router.js';
export type AnyRedirect = Redirect<any, any, any, any, any>;
/**
 * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RedirectType)
 */
export type Redirect<TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = undefined, TMaskFrom extends string = TFrom, TMaskTo extends string = '.'> = Response & {
    options: NavigateOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;
    redirectHandled?: boolean;
};
export type RedirectOptions<TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string | undefined = undefined, TMaskFrom extends string = TFrom, TMaskTo extends string = '.'> = {
    href?: string;
    /**
     * @deprecated Use `statusCode` instead
     **/
    code?: number;
    /**
     * The HTTP status code to use when redirecting.
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RedirectType#statuscode-property)
     */
    statusCode?: number;
    /**
     * If provided, will throw the redirect object instead of returning it. This can be useful in places where `throwing` in a function might cause it to have a return type of `never`. In that case, you can use `redirect({ throw: true })` to throw the redirect object instead of returning it.
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RedirectType#throw-property)
     */
    throw?: any;
    /**
     * The HTTP headers to use when redirecting.
     * @link [API Docs](https://tanstack.com/router/latest/docs/framework/react/api/router/RedirectType#headers-property)
     */
    headers?: HeadersInit;
} & NavigateOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;
export type ResolvedRedirect<TRouter extends AnyRouter = RegisteredRouter, TFrom extends string = string, TTo extends string = '', TMaskFrom extends string = TFrom, TMaskTo extends string = ''> = Redirect<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;
export declare function redirect<TRouter extends AnyRouter = RegisteredRouter, const TTo extends string | undefined = '.', const TFrom extends string = string, const TMaskFrom extends string = TFrom, const TMaskTo extends string = ''>(opts: RedirectOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>): Redirect<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;
export declare function isRedirect(obj: any): obj is AnyRedirect;
export declare function isResolvedRedirect(obj: any): obj is AnyRedirect & {
    options: {
        href: string;
    };
};
export declare function parseRedirect(obj: any): Redirect<AnyRouter, string, ".", string, ""> | undefined;
