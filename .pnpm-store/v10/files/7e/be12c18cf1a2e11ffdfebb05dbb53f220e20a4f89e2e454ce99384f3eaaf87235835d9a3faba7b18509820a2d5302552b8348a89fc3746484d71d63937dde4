import { Accessor, JSX } from 'solid-js';
type ExpanderProps = {
    expanded: boolean;
    style?: JSX.CSSProperties;
};
export declare const Expander: ({ expanded, style }: ExpanderProps) => JSX.Element;
type Entry = {
    label: string;
};
type RendererProps = {
    handleEntry: HandleEntryFn;
    label?: JSX.Element;
    value: Accessor<unknown>;
    subEntries: Array<Entry>;
    subEntryPages: Array<Array<Entry>>;
    type: string;
    expanded: Accessor<boolean>;
    toggleExpanded: () => void;
    pageSize: number;
    filterSubEntries?: (subEntries: Array<Property>) => Array<Property>;
};
/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
 */
export declare function chunkArray<T>(array: Array<T>, size: number): Array<Array<T>>;
type HandleEntryFn = (entry: Entry) => JSX.Element;
type ExplorerProps = Partial<RendererProps> & {
    defaultExpanded?: true | Record<string, boolean>;
    value: Accessor<unknown>;
};
type Property = {
    defaultExpanded?: boolean | Record<string, boolean>;
    label: string;
    value: unknown;
};
export declare function Explorer({ value, defaultExpanded, pageSize, filterSubEntries, ...rest }: ExplorerProps): JSX.Element;
export {};
