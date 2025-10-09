import { TargetTemplate } from './template.js';
import { GetRoutesByFileMapResult } from './types.js';
import { Config } from './config.js';
interface fs {
    stat: (filePath: string) => Promise<{
        mtimeMs: bigint;
        mode: number;
        uid: number;
        gid: number;
    }>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
    writeFile: (filePath: string, content: string) => Promise<void>;
    readFile: (filePath: string) => Promise<{
        stat: {
            mtimeMs: bigint;
        };
        fileContent: string;
    } | 'file-not-existing'>;
    chmod: (filePath: string, mode: number) => Promise<void>;
    chown: (filePath: string, uid: number, gid: number) => Promise<void>;
}
export type FileEventType = 'create' | 'update' | 'delete';
export type FileEvent = {
    type: FileEventType;
    path: string;
};
export type GeneratorEvent = FileEvent | {
    type: 'rerun';
};
export declare class Generator {
    /**
     * why do we have two caches for the route files?
     * During processing, we READ from the cache and WRITE to the shadow cache.
     *
     * After a route file is processed, we write to the shadow cache.
     * If during processing we bail out and re-run, we don't lose this modification
     * but still can track whether the file contributed changes and thus the route tree file needs to be regenerated.
     * After all files are processed, we swap the shadow cache with the main cache and initialize a new shadow cache.
     * That way we also ensure deleted/renamed files don't stay in the cache forever.
     */
    private routeNodeCache;
    private routeNodeShadowCache;
    private routeTreeFileCache;
    config: Config;
    targetTemplate: TargetTemplate;
    private root;
    private routesDirectoryPath;
    private sessionId?;
    private fs;
    private logger;
    private generatedRouteTreePath;
    private runPromise;
    private fileEventQueue;
    private plugins;
    private pluginsWithTransform;
    private transformPlugins;
    private routeGroupPatternRegex;
    private physicalDirectories;
    constructor(opts: {
        config: Config;
        root: string;
        fs?: fs;
    });
    private getRoutesDirectoryPath;
    getRoutesByFileMap(): GetRoutesByFileMapResult;
    run(event?: GeneratorEvent): Promise<void>;
    private generatorInternal;
    private swapCaches;
    private buildRouteTreeFileContent;
    private getImportPath;
    private processRouteNodeFile;
    private didRouteFileChangeComparedToCache;
    private didFileChangeComparedToCache;
    private safeFileWrite;
    private getTempFileName;
    private isRouteFileCacheFresh;
    private handleRootNode;
    private handleNode;
    private isFileRelevantForRouteTreeGeneration;
}
export {};
