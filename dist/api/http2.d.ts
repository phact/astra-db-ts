/// <reference types="node" />
import * as http2 from 'http2';
import { HTTPRequestStrategy, InternalAPIResponse, InternalHTTPRequestInfo } from './types';
export declare class HTTP2Strategy implements HTTPRequestStrategy {
    origin: string;
    closed: boolean;
    session: http2.ClientHttp2Session;
    constructor(baseURL: string);
    request(info: InternalHTTPRequestInfo): Promise<InternalAPIResponse>;
    close(): void;
    private _reviveSession;
}
