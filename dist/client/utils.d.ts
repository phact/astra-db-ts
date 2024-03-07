import { HTTPClient } from '../api/http-client';
declare const __error: unique symbol;
/**
 * Represents some type-level error which forces immediate attention rather than failing @ runtime.
 *
 * More inflexable type than `never`, and gives contextual error messages.
 *
 * @example
 * ```
 * function unsupported(): TypeErr<'Unsupported operation'> {
 *   throw new Error('Unsupported operation');
 * }
 *
 * // Doesn't compile with error:
 * // Type '{ [__error]: "Unsupported operation"; }' is not assignable to type 'string'"
 * const result: string = unsupported();
 * ```
 */
export type TypeErr<S> = unknown & {
    [__error]: S;
};
interface ParsedUri {
    baseUrl: string;
    baseApiPath: string;
    keyspaceName: string;
    applicationToken: string;
    logLevel: string;
}
export declare const parseUri: (uri: string) => ParsedUri;
export declare function getKeyspaceName(pathFromUrl?: string | null): string;
/**
 * Create an Astra connection URI while connecting to Astra JSON API
 * @param apiEndPoint the API EndPoint of the Astra database
 * @param keyspace the keyspace to connect to
 * @param applicationToken an Astra application token
 * @param baseApiPath baseAPI path defaults to /api/json/v1
 * @param logLevel an winston log level (error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6)
 * @returns URL as string
 */
export declare function createAstraUri(apiEndPoint: string, keyspace: string, applicationToken?: string, baseApiPath?: string, logLevel?: string): string;
export declare function createNamespace(httpClient: HTTPClient, name: string): Promise<import("../api").APIResponse>;
export declare function dropNamespace(httpClient: HTTPClient, name: string): Promise<import("../api").APIResponse>;
export declare function setDefaultIdForInsert<T extends {
    _id?: string;
}>(document: T): asserts document is T & {
    _id: string;
};
export declare function setDefaultIdForUpsert(command: Record<string, any>, replace?: boolean): void;
export declare function withoutFields<T extends Record<string, any> | undefined>(obj: T, ...fields: string[]): T;
export {};
