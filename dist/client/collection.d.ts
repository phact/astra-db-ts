import { FindCursor } from './cursor';
import { HTTPClient } from '../api';
import { InsertOneResult } from './types/insert/insert-one';
import { InsertManyOptions, InsertManyResult } from './types/insert/insert-many';
import { UpdateOneOptions, UpdateOneResult } from './types/update/update-one';
import { UpdateManyOptions, UpdateManyResult } from './types/update/update-many';
import { DeleteOneOptions, DeleteOneResult } from './types/delete/delete-one';
import { DeleteManyResult } from './types/delete/delete-many';
import { FindOptions } from './types/find/find';
import { ModifyResult } from './types/find/find-common';
import { FindOneOptions } from './types/find/find-one';
import { FindOneAndDeleteOptions } from './types/find/find-one-delete';
import { FindOneAndUpdateOptions } from './types/find/find-one-update';
import { FindOneAndReplaceOptions } from './types/find/find-one-replace';
import { Filter } from './types/filter';
import { UpdateFilter } from './types/update-filter';
import { Flatten, FoundDoc, NoId, WithId } from './types/utils';
import { SomeDoc } from './document';
import { InsertManyBulkOptions, InsertManyBulkResult } from './types/insert/insert-many-bulk';
import { Db } from './db';
import { FindCursorV2 } from './cursor-v2';
import { ToDotNotation } from './types/dot-notation';
import { CollectionOptions } from './types/collections/collection-options';
import { BaseOptions } from './types/common';
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
export declare class Collection<Schema extends SomeDoc = SomeDoc> {
    private readonly _collectionName;
    private readonly _httpClient;
    private readonly _db;
    constructor(db: Db, httpClient: HTTPClient, name: string);
    /**
     * @return The name of the collection.
     */
    get collectionName(): string;
    /**
     * @return The namespace (aka keyspace) of the parent database.
     */
    get namespace(): string;
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
    insertOne(document: Schema, options?: BaseOptions): Promise<InsertOneResult>;
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
    insertMany(documents: Schema[], options?: InsertManyOptions): Promise<InsertManyResult>;
    insertManyBulk(documents: Schema[], options?: InsertManyBulkOptions): Promise<InsertManyBulkResult<Schema>>;
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
    updateOne(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: UpdateOneOptions<Schema>): Promise<UpdateOneResult>;
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
    updateMany(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: UpdateManyOptions): Promise<UpdateManyResult>;
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
    deleteOne(filter?: Filter<Schema>, options?: DeleteOneOptions<Schema>): Promise<DeleteOneResult>;
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
    deleteMany(filter?: Filter<Schema>, options?: BaseOptions): Promise<DeleteManyResult>;
    deleteManyBulk(filter?: Filter<Schema>): Promise<DeleteManyResult>;
    find<GetSim extends boolean = false>(filter: Filter<Schema>, options?: FindOptions<Schema, GetSim>): FindCursor<FoundDoc<Schema, GetSim>>;
    findV2<GetSim extends boolean = false>(filter: Filter<Schema>, options?: FindOptions<Schema, GetSim>): FindCursorV2<FoundDoc<Schema, GetSim>>;
    distinct<Key extends keyof ToDotNotation<FoundDoc<Schema, GetSim>> & string, GetSim extends boolean = false>(key: Key, filter?: Filter<Schema>, _?: FindOptions<Schema, GetSim>): Promise<Flatten<ToDotNotation<FoundDoc<Schema, GetSim>>[Key]>[]>;
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
    findOne<GetSim extends boolean = false>(filter: Filter<Schema>, options?: FindOneOptions<Schema, GetSim>): Promise<FoundDoc<Schema, GetSim> | null>;
    /**
     * Finds a single document in the collection and replaces it.
     *
     * Set `returnDocument` to `'after'` to return the document as it is after the replacement, or `'before'` to return the
     * document as it was before the replacement.
     *
     * You can specify a `sort` option to determine which document to find if multiple documents match the filter.
     *
     * You can also set `upsert` to `true` to insert a new document if no document matches the filter.
     *
     * @example
     * ```typescript
     * const doc = await collection.findOneAndReplace(
     *   { _id: '1' },
     *   { _id: '1', name: 'John Doe' },
     *   { returnDocument: 'after' }
     * );
     *
     * // Prints { _id: '1', name: 'John Doe' }
     * console.log(doc);
     * ```
     *
     * @param filter - A filter to select the document to find.
     * @param replacement - The replacement document, which contains no `_id` field.
     * @param options - The options for the operation.
     */
    findOneAndReplace(filter: Filter<Schema>, replacement: NoId<Schema>, options: FindOneAndReplaceOptions<Schema> & {
        includeResultMetadata: true;
    }): Promise<ModifyResult<Schema>>;
    findOneAndReplace(filter: Filter<Schema>, replacement: NoId<Schema>, options: FindOneAndReplaceOptions<Schema> & {
        includeResultMetadata: false;
    }): Promise<WithId<Schema> | null>;
    findOneAndReplace(filter: Filter<Schema>, replacement: NoId<Schema>, options: FindOneAndReplaceOptions<Schema>): Promise<WithId<Schema> | null>;
    /**
     * @deprecated Use {@link countDocuments} instead
     */
    count(filter?: Filter<Schema>, options?: BaseOptions): Promise<number>;
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
    countDocuments(filter?: Filter<Schema>, options?: BaseOptions): Promise<number>;
    /**
     * Finds a single document in the collection and deletes it.
     *
     * You can specify a `sort` option to determine which document to find if multiple documents match the filter.
     *
     * @example
     * ```typescript
     * await collection.insertOne({ _id: '1', name: 'John Doe' });
     * const doc = await collection.findOneAndDelete({ _id: '1' });
     * console.log(doc); // The deleted document
     * ```
     *
     * @param filter - A filter to select the document to find.
     * @param options - The options for the operation.
     */
    findOneAndDelete(filter: Filter<Schema>, options?: FindOneAndDeleteOptions<Schema> & {
        includeResultMetadata: true;
    }): Promise<ModifyResult<Schema>>;
    findOneAndDelete(filter: Filter<Schema>, options?: FindOneAndDeleteOptions<Schema> & {
        includeResultMetadata: false;
    }): Promise<WithId<Schema> | null>;
    findOneAndDelete(filter: Filter<Schema>, options?: FindOneAndDeleteOptions<Schema>): Promise<WithId<Schema> | null>;
    /**
     * Finds a single document in the collection and updates it.
     *
     * Set `returnDocument` to `'after'` to return the document as it is after the update, or `'before'` to return the
     * document as it was before the update.
     *
     * You can specify a `sort` option to determine which document to find if multiple documents match the filter.
     *
     * You can also set `upsert` to `true` to insert a new document if no document matches the filter.
     *
     * @example
     * ```typescript
     * const doc = await collection.findOneAndUpdate(
     *   { _id: '1' },
     *   { $set: { name: 'Jane Doe' } },
     *   { returnDocument: 'after' }
     * );
     *
     * // Prints { _id: '1', name: 'Jane Doe' }
     * console.log(doc);
     * ```
     *
     * @param filter - A filter to select the document to find.
     * @param update - The update to apply to the selected document.
     * @param options - The options for the operation.
     */
    findOneAndUpdate(filter: Filter<Schema>, update: UpdateFilter<Schema>, options: FindOneAndUpdateOptions<Schema> & {
        includeResultMetadata: true;
    }): Promise<ModifyResult<Schema>>;
    findOneAndUpdate(filter: Filter<Schema>, update: UpdateFilter<Schema>, options: FindOneAndUpdateOptions<Schema> & {
        includeResultMetadata: false;
    }): Promise<WithId<Schema> | null>;
    findOneAndUpdate(filter: Filter<Schema>, update: UpdateFilter<Schema>, options: FindOneAndUpdateOptions<Schema>): Promise<WithId<Schema> | null>;
    /**
     * @return The options that the collection was created with (i.e. the `vector` and `indexing` operations).
     */
    options(): Promise<CollectionOptions<SomeDoc>>;
    /**
     * Drops the collection from the database.
     *
     * @example
     * ```typescript
     * const collection = await db.createCollection('my_collection');
     * await collection.drop();
     * ```
     */
    drop(options?: BaseOptions): Promise<boolean>;
    /**
     * @deprecated Use {@link collectionName} instead
     */
    get name(): string;
}
export declare class AstraClientError extends Error {
    command: Record<string, any>;
    constructor(message: any, command: Record<string, any>);
}
export declare function dropWhileEq<T>(arr: T[], target: T): T[];
