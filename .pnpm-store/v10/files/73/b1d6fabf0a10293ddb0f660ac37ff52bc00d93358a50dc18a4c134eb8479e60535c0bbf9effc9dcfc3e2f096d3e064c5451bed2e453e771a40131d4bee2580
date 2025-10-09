import { VirtualRouteNode } from '@tanstack/virtual-file-routes';
import { GetRouteNodesResult, RouteNode } from '../../types.cjs';
import { Config } from '../../config.cjs';
export declare function getRouteNodes(tsrConfig: Pick<Config, 'routesDirectory' | 'virtualRouteConfig' | 'routeFileIgnorePrefix' | 'disableLogging' | 'indexToken' | 'routeToken'>, root: string): Promise<GetRouteNodesResult>;
export declare function getRouteNodesRecursive(tsrConfig: Pick<Config, 'routesDirectory' | 'routeFileIgnorePrefix' | 'disableLogging' | 'indexToken' | 'routeToken'>, root: string, fullDir: string, nodes?: Array<VirtualRouteNode>, parent?: RouteNode): Promise<{
    children: Array<RouteNode>;
    physicalDirectories: Array<string>;
}>;
