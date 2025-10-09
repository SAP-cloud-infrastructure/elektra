import { ParsedHistoryState } from '@tanstack/history';
import { AnySchema } from './validators.cjs';
export interface ParsedLocation<TSearchObj extends AnySchema = {}> {
    href: string;
    pathname: string;
    search: TSearchObj;
    searchStr: string;
    state: ParsedHistoryState;
    hash: string;
    maskedLocation?: ParsedLocation<TSearchObj>;
    unmaskOnReload?: boolean;
}
