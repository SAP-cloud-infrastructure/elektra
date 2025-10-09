import { HandlerCallback } from './handlerCallback.js';
import { AnyRouter } from '../router.js';
import { Manifest } from '../manifest.js';
export type RequestHandler<TRouter extends AnyRouter> = (cb: HandlerCallback<TRouter>) => Promise<Response>;
export declare function createRequestHandler<TRouter extends AnyRouter>({ createRouter, request, getRouterManifest, }: {
    createRouter: () => TRouter;
    request: Request;
    getRouterManifest?: () => Manifest | Promise<Manifest>;
}): RequestHandler<TRouter>;
