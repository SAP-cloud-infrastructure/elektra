import { OutgoingHttpHeaders } from 'node:http2';
export declare function headersInitToObject(headers: HeadersInit): Record<keyof OutgoingHttpHeaders, string>;
type AnyHeaders = Headers | HeadersInit | Record<string, string> | Array<[string, string]> | OutgoingHttpHeaders | undefined;
export declare function mergeHeaders(...headers: Array<AnyHeaders>): Headers;
export {};
