import { SerovalNode } from 'seroval';
interface ErrorNode {
    message: SerovalNode;
}
/**
 * this plugin serializes only the `message` part of an Error
 * this helps with serializing e.g. a ZodError which has functions attached that cannot be serialized
 */
export declare const ShallowErrorPlugin: import('seroval').Plugin<Error, ErrorNode>;
export {};
