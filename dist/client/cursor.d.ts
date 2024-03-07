import { TypeErr } from './utils';
import { HTTPClient } from '../api';
type CursorStatus = 'uninitialized' | 'initialized' | 'executing' | 'executed';
export declare class FindCursor<Schema> {
    httpClient: HTTPClient;
    filter: Record<string, any>;
    options: Record<string, any>;
    documents: Schema[];
    status: CursorStatus;
    nextPageState?: string;
    limit: number;
    page: Schema[];
    exhausted: boolean;
    pageIndex: number;
    constructor(httpClient: HTTPClient, filter: Record<string, any>, options?: Record<string, any>);
    toArray(): Promise<Schema[]>;
    private _getAll;
    next(): Promise<Schema | null>;
    private _getMore;
    forEach(iterator: any): Promise<void>;
    count(): Promise<number>;
    stream(): TypeErr<'Streaming cursors are not supported'>;
}
export {};
