import { AnyRouter } from '../router.cjs';
import { DehydratedMatch } from './ssr-client.cjs';
import { AnyRouteMatch } from '../Matches.cjs';
import { Manifest } from '../manifest.cjs';
declare module '../router' {
    interface ServerSsr {
        setRenderFinished: () => void;
    }
    interface RouterEvents {
        onInjectedHtml: {
            type: 'onInjectedHtml';
            promise: Promise<string>;
        };
    }
}
export declare const GLOBAL_TSR = "$_TSR";
export declare function dehydrateMatch(match: AnyRouteMatch): DehydratedMatch;
export declare function attachRouterServerSsrUtils(router: AnyRouter, manifest: Manifest | undefined): void;
