import { AnyRouter } from '../router.js';
export interface HandlerCallback<TRouter extends AnyRouter> {
    (ctx: {
        request: Request;
        router: TRouter;
        responseHeaders: Headers;
    }): Response | Promise<Response>;
}
export declare function defineHandlerCallback<TRouter extends AnyRouter>(handler: HandlerCallback<TRouter>): HandlerCallback<TRouter>;
