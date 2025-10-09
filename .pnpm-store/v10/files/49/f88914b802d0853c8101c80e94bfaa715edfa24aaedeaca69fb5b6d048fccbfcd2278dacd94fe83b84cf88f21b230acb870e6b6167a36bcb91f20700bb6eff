import { VirtualRouteNode } from './types.cjs';
export type ConfigFnObject<TConfig> = () => TConfig;
export type ConfigFnPromise<TConfig> = () => Promise<TConfig>;
export type ConfigFn<TConfig> = () => TConfig | Promise<TConfig>;
export type ConfigExport<TConfig> = TConfig | Promise<TConfig> | ConfigFnObject<TConfig> | ConfigFnPromise<TConfig> | ConfigFn<TConfig>;
export type VirtualRouteSubtreeConfig = Array<VirtualRouteNode>;
/**
 * Type helper to make it easier to use __virtual.ts
 * accepts a direct {@link VirtualRouteSubtreeConfig} object, or a function that returns it.
 */
export declare function defineVirtualSubtreeConfig(config: VirtualRouteSubtreeConfig): VirtualRouteSubtreeConfig;
export declare function defineVirtualSubtreeConfig(config: Promise<VirtualRouteSubtreeConfig>): Promise<VirtualRouteSubtreeConfig>;
export declare function defineVirtualSubtreeConfig(config: ConfigFnObject<VirtualRouteSubtreeConfig>): ConfigFnObject<VirtualRouteSubtreeConfig>;
export declare function defineVirtualSubtreeConfig(config: ConfigExport<VirtualRouteSubtreeConfig>): ConfigExport<VirtualRouteSubtreeConfig>;
