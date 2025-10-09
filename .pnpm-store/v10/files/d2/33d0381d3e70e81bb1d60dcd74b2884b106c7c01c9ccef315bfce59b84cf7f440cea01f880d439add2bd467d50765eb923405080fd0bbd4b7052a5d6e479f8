import { FsRouteType, GetRouteNodesResult } from '../../types.js';
import { Config } from '../../config.js';
export declare function isVirtualConfigFile(fileName: string): boolean;
export declare function getRouteNodes(config: Pick<Config, 'routesDirectory' | 'routeFilePrefix' | 'routeFileIgnorePrefix' | 'routeFileIgnorePattern' | 'disableLogging' | 'routeToken' | 'indexToken'>, root: string): Promise<GetRouteNodesResult>;
/**
 * Determines the metadata for a given route path based on the provided configuration.
 *
 * @param routePath - The determined initial routePath.
 * @param config - The user configuration object.
 * @returns An object containing the type of the route and the variable name derived from the route path.
 */
export declare function getRouteMeta(routePath: string, config: Pick<Config, 'routeToken' | 'indexToken'>): {
    fsRouteType: Extract<FsRouteType, 'static' | 'layout' | 'api' | 'lazy' | 'loader' | 'component' | 'pendingComponent' | 'errorComponent'>;
    variableName: string;
};
