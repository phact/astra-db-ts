import { HTTPClient } from '../api';
import { FindOptions } from './types/find/find';
import { SomeDoc } from './document';
import { Filter } from './types/filter';
import { ProjectionOption, SortOption } from './types/common';
/**
 * Worth adding a second data type parameter to this class, so that we can type mapped cursors properly, or no??
 */
export declare class FindCursorV2<T> {
    private readonly _namespace;
    private readonly _httpClient;
    private readonly _options;
    private _filter;
    private _mapping?;
    private _buffer;
    private _nextPageState?;
    private _state;
    private _numReturned;
    constructor(namespace: string, httpClient: HTTPClient, filter: Filter<SomeDoc>, options?: FindOptions<SomeDoc, boolean>);
    /**
     * @return The namespace (aka keyspace) of the parent database.
     */
    get namespace(): string;
    /**
     * @return Whether or not the cursor is closed.
     */
    get closed(): boolean;
    /**
     * @return The number of documents in the buffer.
     */
    bufferedCount(): number;
    /**
     * Sets the filter for the cursor, overwriting any previous filter. Note that this filter is weakly typed. Prefer
     * to pass in a filter through the constructor instead, if strongly typed filters are desired.
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * **NB. This method acts on the original documents, before any mapping**
     *
     * @param filter - A filter to select which documents to return.
     *
     * @return The cursor.
     */
    filter(filter: Filter<SomeDoc>): FindCursorV2<T>;
    /**
     * Sets the sort criteria for prioritizing documents. Note that this sort is weakly typed. Prefer to pass in a sort
     * through the constructor instead, if strongly typed sorts are desired.
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * **NB. This method acts on the original documents, before any mapping**
     *
     * @param sort - The sort order to prioritize which documents are returned.
     *
     * @return The cursor.
     */
    sort(sort: SortOption<SomeDoc>): FindCursorV2<T>;
    /**
     * Sets the maximum number of documents to return.
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * @param limit - The limit for this cursor.
     *
     * @return The cursor.
     */
    limit(limit: number): FindCursorV2<T>;
    /**
     * Sets the number of documents to skip before returning.
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * @param skip - The skip for the cursor query.
     *
     * @return The cursor.
     */
    skip(skip: number): FindCursorV2<T>;
    /**
     * Sets the projection for the cursor, overwriting any previous projection. Note that this projection is weakly typed.
     * Prefer to pass in a projection through the constructor instead, if strongly typed projections are desired.
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * **NB. This method acts on the original documents, before any mapping**
     *
     * @param projection - Specifies which fields should be included/excluded in the returned documents.
     *
     * @return The cursor.
     */
    project<R>(projection: ProjectionOption<SomeDoc>): FindCursorV2<R>;
    /**
     * Map all documents using the provided mapping function. Previous mapping functions will be composed with the new
     * mapping function (new ∘ old).
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * **NB. Unlike Mongo, it is okay to map a cursor to `null`.**
     *
     * @param mapping - The mapping function to apply to all documents.
     *
     * @return The cursor.
     */
    map<R>(mapping: (doc: T) => R): FindCursorV2<R>;
    /**
     * Sets the batch size for the cursor's buffer.
     *
     * The cursor MUST be uninitialized when calling this method.
     *
     * **NB. This method mutates the cursor.**
     *
     * @param batchSize - The batch size for this cursor.
     *
     * @return The cursor.
     */
    batchSize(batchSize: number): FindCursorV2<T>;
    /**
     * Returns a new, uninitialized cursor with the same filter and options set on this cursor. No state is shared between
     * the two cursors; only the configuration. Mapping functions are not cloned.
     *
     * @return A behavioral clone of this cursor.
     */
    clone(): FindCursorV2<T>;
    /**
     * I'm so blimming confused. I've been looking at MongoDB's code for this method and for some reason it's typed
     * as returning a `T[]` while in reality it appears to return an array of the original documents, not the mapped
     * documents??? No clue if it's a bug or if I'm just misunderstanding something, but I can't find anything
     * about this method online beyond basic documentation.
     */
    readBufferedDocuments(max?: number): T[];
    /**
     * Rewinds the cursor to its uninitialized state, clearing the buffer and any state. Any configuration set on the
     * cursor will remain, but iteration will start from the beginning, sending new queries to the server, even if the
     * resultant data was already fetched by this cursor.
     */
    rewind(): void;
    /**
     * Fetches the next document from the cursor. Returns `null` if there are no more documents to fetch.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return `null`.
     *
     * @return The next document, or `null` if there are no more documents.
     */
    next(): Promise<T | null>;
    /**
     * Attempts to fetch the next document from the cursor. Returns `null` if there are no more documents to fetch.
     *
     * Will also return `null` if the buffer is exhausted.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return `null`.
     *
     * @return The next document, or `null` if there are no more documents.
     */
    tryNext(): Promise<T | null>;
    /**
     * Tests if there is a next document in the cursor.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return `false`.
     *
     * @return Whether or not there is a next document.
     */
    hasNext(): Promise<boolean>;
    [Symbol.asyncIterator](): AsyncGenerator<T, void, void>;
    /**
     * Iterates over all documents in the cursor, calling the provided consumer for each document.
     *
     * If the consumer returns `false`, iteration will stop.
     *
     * Note that there'll only be partial results if the cursor has been previously iterated over. You may use {@link rewind}
     * to reset the cursor.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return immediately.
     *
     * @param consumer - The consumer to call for each document.
     *
     * @return A promise that resolves when iteration is complete.
     *
     * @deprecated - Prefer the `for await (const doc of cursor) { ... }` syntax instead.
     */
    forEach(consumer: (doc: T) => boolean | void): Promise<void>;
    /**
     * Returns an array of all matching documents in the cursor. The user should ensure that there is enough memory to
     * store all documents in the cursor.
     *
     * Note that there'll only be partial results if the cursor has been previously iterated over. You may use {@link rewind}
     * to reset the cursor.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return an empty array.
     *
     * @return An array of all documents in the cursor.
     */
    toArray(): Promise<T[]>;
    /**
     * Returns the number of documents matching the cursor. This method will iterate over the entire cursor to count the
     * documents.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return 0.
     *
     * @return The number of documents matching the cursor.
     *
     * @deprecated - Use {@link Collection.countDocuments} instead.
     */
    count(): Promise<number>;
    /**
     * Closes the cursor. The cursor will be unusable after this method is called, or until {@link rewind} is called.
     */
    close(): Promise<void>;
    private _assertUninitialized;
    private _next;
    private _getMore;
}
