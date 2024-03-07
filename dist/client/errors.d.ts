import { APIResponse } from '../api';
export declare class DataAPIError extends Error implements APIResponse {
    errors?: any[];
    status?: Record<string, any>;
    data?: Record<string, any>;
    command: Record<string, any>;
    constructor(response: APIResponse, command: Record<string, any>);
}
export declare class DataAPITimeout extends Error {
    readonly command: Record<string, any>;
    constructor(command: Record<string, any>);
}
export declare class InsertManyOrderedError extends Error {
    readonly baseError: Error;
    readonly insertedIDs: string[];
    readonly failedInserts: {
        _id: unknown;
    }[];
    constructor(baseError: Error, insertedIDs: string[], failedInserts: {
        _id: unknown;
    }[]);
}
