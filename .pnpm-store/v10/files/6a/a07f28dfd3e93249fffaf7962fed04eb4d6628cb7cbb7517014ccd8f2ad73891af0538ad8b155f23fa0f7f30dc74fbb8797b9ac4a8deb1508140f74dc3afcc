import type { SerovalNode } from '../../types';
import { BaseParserContext } from '../parser';
export default abstract class BaseAsyncParserContext extends BaseParserContext {
    private parseItems;
    private parseArray;
    private parseProperties;
    private parsePlainObject;
    private parseBoxed;
    private parseTypedArray;
    private parseBigIntTypedArray;
    private parseDataView;
    private parseError;
    private parseAggregateError;
    private parseMap;
    private parseSet;
    private parsePromise;
    private parsePlugin;
    private parseStream;
    private parseObject;
    protected parseFunction(current: unknown): Promise<SerovalNode>;
    parse<T>(current: T): Promise<SerovalNode>;
    parseTop<T>(current: T): Promise<SerovalNode>;
}
//# sourceMappingURL=async.d.ts.map