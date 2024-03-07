import { HTTPRequestStrategy, InternalAPIResponse, InternalHTTPRequestInfo } from './types';
export declare class HTTP1Strategy implements HTTPRequestStrategy {
    request(info: InternalHTTPRequestInfo): Promise<InternalAPIResponse>;
}
