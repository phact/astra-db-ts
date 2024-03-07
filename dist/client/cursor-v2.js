"use strict";
// Copyright DataStax, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindCursorV2 = void 0;
const find_1 = require("./types/find/find");
/**
 * Worth adding a second data type parameter to this class, so that we can type mapped cursors properly, or no??
 */
class FindCursorV2 {
    constructor(namespace, httpClient, filter, options) {
        this._buffer = [];
        this._state = 0 /* CursorStatus.Uninitialized */;
        this._numReturned = 0;
        this._namespace = namespace;
        this._httpClient = httpClient;
        this._filter = filter;
        this._options = { ...options };
    }
    /**
     * @return The namespace (aka keyspace) of the parent database.
     */
    get namespace() {
        return this._namespace;
    }
    /**
     * @return Whether or not the cursor is closed.
     */
    get closed() {
        return this._state === 2 /* CursorStatus.Closed */;
    }
    /**
     * @return The number of documents in the buffer.
     */
    bufferedCount() {
        return this._buffer.length;
    }
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
    filter(filter) {
        this._assertUninitialized();
        this._filter = filter;
        return this;
    }
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
    sort(sort) {
        this._assertUninitialized();
        this._options.sort = sort;
        return this;
    }
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
    limit(limit) {
        this._assertUninitialized();
        this._options.limit = limit;
        return this;
    }
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
    skip(skip) {
        this._assertUninitialized();
        this._options.skip = skip;
        return this;
    }
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
    project(projection) {
        this._assertUninitialized();
        this._options.projection = projection;
        return this;
    }
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
    map(mapping) {
        this._assertUninitialized();
        if (this._mapping) {
            this._mapping = (doc) => mapping(this._mapping(doc));
        }
        else {
            this._mapping = mapping;
        }
        return this;
    }
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
    batchSize(batchSize) {
        this._assertUninitialized();
        this._options.batchSize = batchSize;
        return this;
    }
    /**
     * Returns a new, uninitialized cursor with the same filter and options set on this cursor. No state is shared between
     * the two cursors; only the configuration. Mapping functions are not cloned.
     *
     * @return A behavioral clone of this cursor.
     */
    clone() {
        return new FindCursorV2(this._namespace, this._httpClient, this._filter, this._options);
    }
    /**
     * I'm so blimming confused. I've been looking at MongoDB's code for this method and for some reason it's typed
     * as returning a `T[]` while in reality it appears to return an array of the original documents, not the mapped
     * documents??? No clue if it's a bug or if I'm just misunderstanding something, but I can't find anything
     * about this method online beyond basic documentation.
     */
    readBufferedDocuments(max) {
        const toRead = Math.min(max ?? this._buffer.length, this._buffer.length);
        return this._buffer.splice(0, toRead);
    }
    /**
     * Rewinds the cursor to its uninitialized state, clearing the buffer and any state. Any configuration set on the
     * cursor will remain, but iteration will start from the beginning, sending new queries to the server, even if the
     * resultant data was already fetched by this cursor.
     */
    rewind() {
        if (this._state === 0 /* CursorStatus.Uninitialized */) {
            return;
        }
        this._buffer.length = 0;
        this._nextPageState = undefined;
        this._state = 0 /* CursorStatus.Uninitialized */;
    }
    /**
     * Fetches the next document from the cursor. Returns `null` if there are no more documents to fetch.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return `null`.
     *
     * @return The next document, or `null` if there are no more documents.
     */
    async next() {
        return this._next(false, true);
    }
    /**
     * Attempts to fetch the next document from the cursor. Returns `null` if there are no more documents to fetch.
     *
     * Will also return `null` if the buffer is exhausted.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return `null`.
     *
     * @return The next document, or `null` if there are no more documents.
     */
    async tryNext() {
        return this._next(false, false);
    }
    /**
     * Tests if there is a next document in the cursor.
     *
     * If the cursor is uninitialized, it will be initialized. If the cursor is closed, this method will return `false`.
     *
     * @return Whether or not there is a next document.
     */
    async hasNext() {
        if (this._buffer.length > 0) {
            return true;
        }
        const doc = await this._next(true, true);
        if (doc !== null) {
            this._buffer.push(doc);
            return true;
        }
        return false;
    }
    async *[Symbol.asyncIterator]() {
        try {
            while (true) {
                const doc = await this.next();
                if (doc === null) {
                    break;
                }
                yield doc;
            }
        }
        finally {
            await this.close();
        }
    }
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
    async forEach(consumer) {
        for await (const doc of this) {
            if (consumer(doc) === false) {
                break;
            }
        }
    }
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
    async toArray() {
        const docs = [];
        for await (const doc of this) {
            docs.push(doc);
        }
        return docs;
    }
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
    async count() {
        let count = 0;
        for await (const _ of this) {
            count++;
        }
        return count;
    }
    /**
     * Closes the cursor. The cursor will be unusable after this method is called, or until {@link rewind} is called.
     */
    async close() {
        this._state = 2 /* CursorStatus.Closed */;
    }
    _assertUninitialized() {
        if (this._state !== 0 /* CursorStatus.Uninitialized */) {
            throw new Error('Cursor has already been initialized');
        }
    }
    async _next(raw, block) {
        if (this._state === 2 /* CursorStatus.Closed */) {
            return null;
        }
        do {
            if (this._buffer.length > 0) {
                const doc = this._buffer.shift();
                try {
                    return (!raw && this._mapping)
                        ? this._mapping(doc)
                        : doc;
                }
                catch (err) {
                    await this.close();
                    throw err;
                }
            }
            if (this._nextPageState === null) {
                return null;
            }
            try {
                await this._getMore();
            }
            catch (err) {
                await this.close();
                throw err;
            }
            if (this._buffer.length === 0 && !block) {
                return null;
            }
        } while (this._buffer.length !== 0);
        return null;
    }
    async _getMore() {
        this._state = 1 /* CursorStatus.Initialized */;
        const options = {};
        const limit = this._options.limit ?? Infinity;
        const batchSize = this._options.batchSize ?? 1000;
        const queryLimit = (limit && limit > 0 && this._numReturned + batchSize > limit)
            ? limit - this._numReturned
            : batchSize;
        if (queryLimit <= 0) {
            this._nextPageState = null;
            return;
        }
        if (queryLimit !== Infinity) {
            options.limit = queryLimit;
        }
        if (this._nextPageState) {
            options.pagingState = this._nextPageState;
        }
        if (this._options.skip) {
            options.skip = this._options.skip;
        }
        if (this._options.includeSimilarity) {
            options.includeSimilarity = this._options.includeSimilarity;
        }
        const command = {
            find: { filter: this._filter }
        };
        if (this._options.sort) {
            command.find.sort = this._options.sort;
        }
        if (this._options.projection) {
            command.find.projection = this._options.projection;
        }
        if (Object.keys(options).length > 0) {
            command.find.options = options;
        }
        const resp = await this._httpClient.executeCommand(command, {}, find_1.internalFindOptionsKeys);
        this._nextPageState = resp.data.nextPageState || null;
        this._buffer = resp.data.documents;
        this._numReturned += this._buffer.length;
    }
}
exports.FindCursorV2 = FindCursorV2;
//# sourceMappingURL=cursor-v2.js.map