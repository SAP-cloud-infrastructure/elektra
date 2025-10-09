import { ParsedLocation } from './location.js';
import { AnyRoute } from './route.js';
import { AnyRouteMatch, MakeRouteMatch } from './Matches.js';
import { AnyRouter, UpdateMatchFn } from './router.js';
export declare function loadMatches(arg: {
    router: AnyRouter;
    location: ParsedLocation;
    matches: Array<AnyRouteMatch>;
    preload?: boolean;
    onReady?: () => Promise<void>;
    updateMatch: UpdateMatchFn;
    sync?: boolean;
}): Promise<Array<MakeRouteMatch>>;
export declare function loadRouteChunk(route: AnyRoute): Promise<void | undefined>;
export declare function routeNeedsPreload(route: AnyRoute): boolean;
export declare const componentTypes: readonly ["component", "errorComponent", "pendingComponent", "notFoundComponent"];
