import { MakeRouteMatch } from '../Matches.js';
import { AnyRouter } from '../router.js';
import { Manifest } from '../manifest.js';
import { GLOBAL_TSR } from './ssr-server.js';
declare global {
    interface Window {
        [GLOBAL_TSR]?: TsrSsrGlobal;
    }
}
export interface TsrSsrGlobal {
    router?: DehydratedRouter;
    c: () => void;
}
export interface DehydratedMatch {
    i: MakeRouteMatch['id'];
    b?: MakeRouteMatch['__beforeLoadContext'];
    l?: MakeRouteMatch['loaderData'];
    e?: MakeRouteMatch['error'];
    u: MakeRouteMatch['updatedAt'];
    s: MakeRouteMatch['status'];
    ssr?: MakeRouteMatch['ssr'];
}
export interface DehydratedRouter {
    manifest: Manifest | undefined;
    dehydratedData?: any;
    lastMatchId?: string;
    matches: Array<DehydratedMatch>;
}
export declare function hydrate(router: AnyRouter): Promise<any>;
