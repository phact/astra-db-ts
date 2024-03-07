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
exports.dropWhileEq = exports.AstraClientError = exports.Collection = void 0;
const cursor_1 = require("./cursor");
const utils_1 = require("./utils");
const insert_many_1 = require("./types/insert/insert-many");
const update_one_1 = require("./types/update/update-one");
const update_many_1 = require("./types/update/update-many");
const find_one_1 = require("./types/find/find-one");
const find_one_update_1 = require("./types/find/find-one-update");
const find_one_replace_1 = require("./types/find/find-one-replace");
const cursor_v2_1 = require("./cursor-v2");
const errors_1 = require("./errors");
/**
 * Represents the interface to a collection in the database.
 *
 * **Shouldn't be directly instantiated, but rather created via {@link Db.createCollection},
 * or connected to using {@link Db.collection}**.
 *
 * Typed as `Collection<Schema>` where `Schema` is the type of the documents in the collection.
 * Operations on the collection will be strongly typed if a specific schema is provided, otherwise
 * remained largely weakly typed if no type is provided, which may be preferred for dynamic data
 * access & operations.
 *
 * @example
 * ```typescript
 * const collection = await db.createCollection<PersonSchema>('my_collection');
 * await collection.insertOne({ _id: '1', name: 'John Doe' });
 * await collection.drop();
 * ```
 *
 * @see SomeDoc
 * @see VectorDoc
 */
class Collection {
    constructor(db, httpClient, name) {
        if (!name) {
            throw new Error('collection name is required');
        }
        this._httpClient = httpClient.cloneShallow();
        this._httpClient.collection = name;
        this._collectionName = name;
        this._db = db;
    }
    /**
     * @return The name of the collection.
     */
    get collectionName() {
        return this._collectionName;
    }
    /**
     * @return The namespace (aka keyspace) of the parent database.
     */
    get namespace() {
        return this._db.namespace;
    }
    /**
     * Inserts a single document into the collection.
     *
     * If the document does not contain an `_id` field, an ObjectId will be generated on the client and assigned to the
     * document. This generation will mutate the document.
     *
     * @example
     * ```typescript
     * await collection.insertOne({ _id: '1', name: 'John Doe' });
     * await collection.insertOne({ name: 'Jane Doe' }); // _id will be generated
     * ```
     *
     * @param document - The document to insert.
     *
     * @param options - The options for the operation.
     */
    async insertOne(document, options) {
        (0, utils_1.setDefaultIdForInsert)(document);
        const command = {
            insertOne: { document },
        };
        const resp = await this._httpClient.executeCommand(command, options);
        return {
            acknowledged: true,
            insertedId: resp.status?.insertedIds[0],
        };
    }
    /**
     * Inserts **up to twenty** documents into the collection.
     *
     * If any document does not contain an `_id` field, an ObjectId will be generated on the client and assigned to the
     * document. This generation will mutate the document.
     *
     * You can set the `ordered` option to `true` to stop the operation after the first error, otherwise all documents
     * may be parallelized and processed in arbitrary order.
     *
     * @example
     * ```typescript
     * await collection.insertMany([
     *   { _id: '1', name: 'John Doe' },
     *   { name: 'Jane Doe' }, // _id will be generated
     * ]);
     * ```
     *
     * @param documents - The documents to insert.
     * @param options - The options for the operation.
     */
    async insertMany(documents, options) {
        if (options?.ordered) {
            return insertManyOrdered(this._httpClient, documents, 20);
        }
        documents.forEach(utils_1.setDefaultIdForInsert);
        const command = {
            insertMany: {
                documents,
                options,
            },
        };
        const resp = await this._httpClient.executeCommand(command, options, insert_many_1.insertManyOptionKeys);
        return {
            acknowledged: true,
            insertedCount: resp.status?.insertedIds?.length || 0,
            insertedIds: resp.status?.insertedIds,
        };
        // return this.insertManyBulk(documents, {
        //   ordered: options?.ordered,
        //   parallel: 1,
        // });
    }
    async insertManyBulk(documents, options) {
        const parallel = (options?.ordered) ? 1 : (options?.parallel ?? 4);
        if (options?.ordered && options?.parallel && options?.parallel !== 1) {
            throw new Error('Parallel insert with ordered option is not supported');
        }
        if (parallel < 1) {
            throw new Error('Parallel must be greater than 0');
        }
        for (let i = 0, n = documents.length; i < n; i++) {
            (0, utils_1.setDefaultIdForInsert)(documents[i]);
        }
        const results = [];
        const failedInserts = [];
        let masterIndex = 0;
        const processQueue = async () => {
            while (masterIndex < documents.length) {
                const localI = masterIndex;
                const endIdx = Math.min(localI + 20, documents.length);
                masterIndex += 20;
                if (localI >= endIdx) {
                    break;
                }
                const slice = documents.slice(localI, endIdx);
                try {
                    // const result = await this.insertMany(slice);
                    const command = {
                        insertMany: {
                            documents: slice,
                            options,
                        },
                    };
                    const resp = await this._httpClient.executeCommand(command, {}, insert_many_1.insertManyOptionKeys);
                    results.push({
                        acknowledged: true,
                        insertedCount: resp.status?.insertedIds?.length || 0,
                        insertedIds: resp.status?.insertedIds,
                    });
                }
                catch (e) {
                    const insertedIDs = e.status?.insertedIds ?? [];
                    const insertedIDSet = new Set(insertedIDs);
                    results.push({
                        acknowledged: true,
                        insertedCount: insertedIDs.length,
                        insertedIds: insertedIDs,
                    });
                    const upperBound = (options?.ordered)
                        ? documents.length
                        : endIdx;
                    for (let j = localI; j < upperBound; j++) {
                        const doc = documents[j];
                        if (insertedIDSet.has(doc._id)) {
                            insertedIDSet.delete(doc._id);
                        }
                        else {
                            failedInserts.push({ document: doc, errors: e.errors });
                        }
                    }
                    if (options?.ordered) {
                        break;
                    }
                }
            }
        };
        const workers = Array.from({ length: parallel }, processQueue);
        await Promise.all(workers);
        return {
            acknowledged: true,
            insertedCount: results.reduce((acc, r) => acc + r.insertedCount, 0),
            insertedIds: results.reduce((acc, r) => acc.concat(r.insertedIds), []),
            failedCount: failedInserts.length,
            failedInserts,
        };
    }
    /**
     * Updates a single document in the collection.
     *
     * You can upsert a document by setting the `upsert` option to `true`.
     *
     * You can also specify a sort option to determine which document to update if multiple documents match the filter.
     *
     * @example
     * ```typescript
     * await collection.insetOne({ _id: '1', name: 'John Doe' });
     * await collection.updateOne({ _id: '1' }, { $set: { name: 'Jane Doe' } });
     * ```
     *
     * @param filter - A filter to select the document to update.
     * @param update - The update to apply to the selected document.
     * @param options - The options for the operation.
     */
    async updateOne(filter, update, options) {
        const command = {
            updateOne: {
                filter,
                update,
                options: (0, utils_1.withoutFields)(options, 'sort'),
            },
        };
        if (options?.sort) {
            command.updateOne.sort = options.sort;
        }
        (0, utils_1.setDefaultIdForUpsert)(command.updateOne);
        const resp = await this._httpClient.executeCommand(command, options, update_one_1.updateOneOptionKeys);
        const commonResult = {
            modifiedCount: resp.status?.modifiedCount,
            matchedCount: resp.status?.matchedCount,
            acknowledged: true,
        };
        return (resp.status?.upsertedId)
            ? {
                ...commonResult,
                upsertedId: resp.status?.upsertedId,
                upsertedCount: 1,
            }
            : commonResult;
    }
    /**
     * Updates **up to twenty** documents in the collection.
     *
     * Will throw a {@link AstraClientError} to indicate if more documents are found to update.
     *
     * You can upsert documents by setting the `upsert` option to `true`.
     *
     * @example
     * ```typescript
     * await collection.insertMany([
     *   { _id: '1', name: 'John Doe', car: 'Renault Twizy' },
     *   { car: 'BMW 330i' },
     *   { car: 'McLaren 4x4 SUV' },
     * ]);
     *
     * await collection.updateMany({
     *   name: { $exists: false }
     * }, {
     *   $set: { name: 'unknown' }
     * });
     * ```
     *
     * @param filter - A filter to select the documents to update.
     * @param update - The update to apply to the selected documents.
     * @param options - The options for the operation.
     */
    async updateMany(filter, update, options) {
        const command = {
            updateMany: {
                filter,
                update,
                options,
            },
        };
        (0, utils_1.setDefaultIdForUpsert)(command.updateMany);
        const updateManyResp = await this._httpClient.executeCommand(command, options, update_many_1.updateManyOptionKeys);
        if (updateManyResp.status?.moreData) {
            throw new AstraClientError(`More than ${updateManyResp.status?.modifiedCount} records found for update by the server`, command);
        }
        const commonResult = {
            modifiedCount: updateManyResp.status?.modifiedCount,
            matchedCount: updateManyResp.status?.matchedCount,
            acknowledged: true,
        };
        return (updateManyResp.status?.upsertedId)
            ? {
                ...commonResult,
                upsertedId: updateManyResp.status?.upsertedId,
                upsertedCount: 1,
            }
            : commonResult;
    }
    /**
     * Deletes a single document from the collection.
     *
     * You can specify a `sort` option to determine which document to delete if multiple documents match the filter.
     *
     * @example
     * ```typescript
     * await collection.insertOne({ _id: '1', name: 'John Doe' });
     * await collection.deleteOne({ _id: '1' });
     * ```
     *
     * @param filter - A filter to select the document to delete.
     * @param options - The options for the operation.
     */
    async deleteOne(filter = {}, options) {
        const command = {
            deleteOne: { filter },
        };
        if (options?.sort) {
            command.deleteOne.sort = options.sort;
        }
        const deleteOneResp = await this._httpClient.executeCommand(command, options);
        return {
            acknowledged: true,
            deletedCount: deleteOneResp.status?.deletedCount,
        };
    }
    /**
     * Deletes **up to twenty** documents from the collection.
     *
     * Will throw a {@link AstraClientError} to indicate if more documents are found to delete.
     *
     * @example
     * ```typescript
     * await collection.insertMany([
     *   { _id: '1', name: 'John Doe' },
     *   { name: 'Jane Doe' },
     * ]);
     *
     * await collection.deleteMany({ name: 'John Doe' });
     * ```
     *
     * @param filter - A filter to select the documents to delete.
     *
     * @param options - The options for the operation.
     */
    async deleteMany(filter = {}, options) {
        const command = {
            deleteMany: { filter },
        };
        const deleteManyResp = await this._httpClient.executeCommand(command, options);
        if (deleteManyResp.status?.moreData) {
            throw new AstraClientError(`More records found to be deleted even after deleting ${deleteManyResp.status?.deletedCount} records`, command);
        }
        return {
            acknowledged: true,
            deletedCount: deleteManyResp.status?.deletedCount,
        };
    }
    async deleteManyBulk(filter = {}) {
        const command = {
            deleteMany: { filter },
        };
        let resp;
        let numDeleted = 0;
        while (!resp || resp.status?.moreData) {
            resp = await this._httpClient.executeCommand(command);
            numDeleted += resp.status?.deletedCount ?? 0;
        }
        return {
            acknowledged: true,
            deletedCount: numDeleted,
        };
    }
    find(filter, options) {
        return new cursor_1.FindCursor(this._httpClient, filter, options);
    }
    findV2(filter, options) {
        return new cursor_v2_1.FindCursorV2(this.namespace, this._httpClient, filter, options);
    }
    async distinct(key, filter = {}, _) {
        const cursor = this.findV2(filter, { projection: { _id: 0, [key]: 1 } });
        const seen = new Set();
        const path = key.split('.');
        for await (const doc of cursor) {
            let value = doc;
            for (let i = 0, n = path.length; i < n; i++) {
                value = value[path[i]];
            }
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    for (let i = 0, n = value.length; i < n; i++) {
                        seen.add(value[i]);
                    }
                }
                else {
                    seen.add(value);
                }
            }
        }
        return Array.from(seen);
    }
    /**
     * Finds a single document in the collection.
     *
     * You can specify a `sort` option to determine which document to find if multiple documents match the filter.
     *
     * You can also specify a `projection` option to determine which fields to include in the returned document.
     *
     * If sorting by `$vector`, you can set the `includeSimilarity` option to `true` to include the similarity score in the
     * returned document as `$similarity: number`.
     *
     * @example
     * ```typescript
     * const doc = await collection.findOne({
     *   $vector: [.12, .52, .32]
     * }, {
     *   includeSimilarity: true
     * });
     *
     * console.log(doc?.$similarity);
     * ```
     *
     * @param filter - A filter to select the document to find.
     * @param options - The options for the operation.
     */
    async findOne(filter, options) {
        options = { ...options };
        const command = {
            findOne: {
                filter,
                options: (0, utils_1.withoutFields)(options, 'sort', 'projection'),
            },
        };
        if (options?.sort) {
            command.findOne.sort = options.sort;
            delete options.sort;
        }
        if (options?.projection && Object.keys(options.projection).length > 0) {
            command.findOne.projection = options.projection;
            delete options.projection;
        }
        const resp = await this._httpClient.executeCommand(command, options, find_one_1.findOneOptionsKeys);
        return resp.data?.document;
    }
    async findOneAndReplace(filter, replacement, options) {
        options = { ...options };
        const command = {
            findOneAndReplace: {
                filter,
                replacement,
                options,
            },
        };
        (0, utils_1.setDefaultIdForUpsert)(command.findOneAndReplace, true);
        if (options?.sort) {
            command.findOneAndReplace.sort = options.sort;
            delete options.sort;
        }
        const resp = await this._httpClient.executeCommand(command, options, find_one_replace_1.findOneAndReplaceOptionsKeys);
        return (options.includeResultMetadata)
            ? {
                value: resp.data?.document,
                ok: 1,
            }
            : resp.data?.document;
    }
    /**
     * @deprecated Use {@link countDocuments} instead
     */
    async count(filter, options) {
        return this.countDocuments(filter, options);
    }
    /**
     * Counts the number of documents in the collection.
     *
     * @example
     * ```typescript
     * await collection.insertMany([
     *   { _id: '1', name: 'John Doe' },
     *   { name: 'Jane Doe' },
     * ]);
     *
     * const count = await collection.countDocuments({ name: 'John Doe' });
     * console.log(count); // 1
     * ```
     *
     * @param filter - A filter to select the documents to count. If not provided, all documents will be counted.
     * @param options - The options for the operation.
     */
    async countDocuments(filter, options) {
        const command = {
            countDocuments: { filter },
        };
        const resp = await this._httpClient.executeCommand(command, options);
        return resp.status?.count;
    }
    async findOneAndDelete(filter, options) {
        const command = {
            findOneAndDelete: { filter },
        };
        if (options?.sort) {
            command.findOneAndDelete.sort = options.sort;
        }
        const resp = await this._httpClient.executeCommand(command, options);
        return (options?.includeResultMetadata)
            ? {
                value: resp.data?.document,
                ok: 1,
            }
            : resp.data?.document;
    }
    async findOneAndUpdate(filter, update, options) {
        options = { ...options };
        const command = {
            findOneAndUpdate: {
                filter,
                update,
                options,
            },
        };
        (0, utils_1.setDefaultIdForUpsert)(command.findOneAndUpdate);
        if (options?.sort) {
            command.findOneAndUpdate.sort = options.sort;
            delete options.sort;
        }
        const resp = await this._httpClient.executeCommand(command, options, find_one_update_1.findOneAndUpdateOptionsKeys);
        return (options.includeResultMetadata)
            ? {
                value: resp.data?.document,
                ok: 1,
            }
            : resp.data?.document;
    }
    /**
     * @return The options that the collection was created with (i.e. the `vector` and `indexing` operations).
     */
    async options() {
        const results = await this._db.listCollections({ nameOnly: false });
        const collection = results.find((c) => c.name === this._collectionName);
        if (!collection) {
            throw new Error(`Collection ${this._collectionName} not found`);
        }
        return collection.options ?? {};
    }
    /**
     * Drops the collection from the database.
     *
     * @example
     * ```typescript
     * const collection = await db.createCollection('my_collection');
     * await collection.drop();
     * ```
     */
    async drop(options) {
        return await this._db.dropCollection(this._collectionName, options);
    }
    /**
     * @deprecated Use {@link collectionName} instead
     */
    get name() {
        return this._collectionName;
    }
}
exports.Collection = Collection;
class AstraClientError extends Error {
    constructor(message, command) {
        const commandName = Object.keys(command)[0] || 'unknown';
        super(`Command "${commandName}" failed with the following error: ${message}`);
        this.command = command;
    }
}
exports.AstraClientError = AstraClientError;
const insertManyOrdered = async (httpClient, documents, chunkSize) => {
    const insertedIds = [];
    for (let i = 0, n = documents.length; i < n; i += chunkSize) {
        const slice = documents.splice(0, chunkSize);
        try {
            const inserted = await insertMany(httpClient, slice, true);
            insertedIds.push(...inserted);
        }
        catch (e) {
            if (!(e instanceof errors_1.DataAPIError)) {
                throw e;
            }
            const justInsertedIds = e.status?.insertedIds ?? [];
            insertedIds.push(...justInsertedIds);
            const failed = dropWhileEq(slice, justInsertedIds.pop());
            failed.push(...documents);
            throw new errors_1.InsertManyOrderedError(e, insertedIds, failed);
        }
    }
    return {
        acknowledged: true,
        insertedCount: insertedIds.length,
        insertedIds,
    };
};
function dropWhileEq(arr, target) {
    const result = [];
    let insert = false;
    for (let i = 0, n = arr.length; i < n; i++) {
        if (!insert && arr[i] !== target) {
            insert = true;
        }
        if (insert) {
            result.push(arr[i]);
        }
    }
    return result;
}
exports.dropWhileEq = dropWhileEq;
const insertMany = async (httpClient, documents, ordered) => {
    const command = {
        insertMany: {
            documents,
            options: { ordered },
        }
    };
    const resp = await httpClient.executeCommand(command, {}, insert_many_1.insertManyOptionKeys);
    return resp.status?.insertedIds ?? [];
};
//# sourceMappingURL=collection.js.map