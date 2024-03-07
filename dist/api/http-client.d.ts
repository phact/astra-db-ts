import { APIResponse, HTTPRequestInfo, HTTPRequestStrategy, InternalHTTPClientOptions } from './types';
import { BaseOptions } from '../client/types/common';
export declare class HTTPClient {
    baseUrl: string;
    applicationToken: string;
    logSkippedOptions: boolean;
    keyspace?: string;
    collection?: string;
    requestStrategy: HTTPRequestStrategy;
    usingHttp2: boolean;
    constructor(options: InternalHTTPClientOptions);
    close(): void;
    isClosed(): boolean | undefined;
    cloneShallow(): HTTPClient;
    executeCommand(data: Record<string, any>, options?: BaseOptions, optionsToRetain?: Set<string>): Promise<APIResponse>;
    request(requestInfo: HTTPRequestInfo): Promise<APIResponse>;
    private _mkError;
}
export declare function handleIfErrorResponse(response: any, data: Record<string, any>): void;
export declare function serializeCommand(data: Record<string, any>, pretty?: boolean): string;
