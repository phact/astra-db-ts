import { HTTP_METHODS } from './';
export interface HTTPClientOptions {
    applicationToken: string;
    baseApiPath?: string;
    logLevel?: string;
    logSkippedOptions?: boolean;
    useHttp2?: boolean;
}
export interface InternalHTTPClientOptions extends HTTPClientOptions {
    baseUrl: string;
    keyspaceName?: string;
    collectionName?: string;
}
export interface APIResponse {
    status?: Record<string, any>;
    errors?: any[];
    data?: Record<string, any>;
}
export interface InternalAPIResponse {
    data?: Record<string, any>;
    status: number;
}
export interface HTTPRequestInfo {
    url: string;
    command: Record<string, unknown>;
    params?: Record<string, string>;
    method?: HTTP_METHODS;
    timeout?: number;
}
export interface InternalHTTPRequestInfo extends HTTPRequestInfo {
    token: string;
    method: HTTP_METHODS;
    timeout: number;
}
export interface HTTPRequestStrategy {
    request: (params: InternalHTTPRequestInfo) => Promise<InternalAPIResponse>;
    close?: () => void;
    closed?: boolean;
}
