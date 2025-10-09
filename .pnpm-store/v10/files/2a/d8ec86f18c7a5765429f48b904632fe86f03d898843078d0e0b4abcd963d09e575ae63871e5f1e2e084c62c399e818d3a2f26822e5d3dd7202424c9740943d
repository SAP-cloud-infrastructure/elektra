import { RouteIds } from './routeInfo.cjs';
import { RegisteredRouter } from './router.cjs';
export type NotFoundError = {
    /**
      @deprecated
      Use `routeId: rootRouteId` instead
    */
    global?: boolean;
    /**
      @private
      Do not use this. It's used internally to indicate a path matching error
    */
    _global?: boolean;
    data?: any;
    throw?: boolean;
    routeId?: RouteIds<RegisteredRouter['routeTree']>;
    headers?: HeadersInit;
};
export declare function notFound(options?: NotFoundError): NotFoundError;
export declare function isNotFound(obj: any): obj is NotFoundError;
