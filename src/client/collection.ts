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

import { FindCursor } from './cursor';
import { HTTPClient } from '@/src/api';
import { setDefaultIdForInsert, setDefaultIdForUpsert, withoutFields } from './utils';
import { InsertOneCommand, InsertOneResult } from '@/src/client/types/insert/insert-one';
import {
  InsertManyCommand,
  insertManyOptionKeys,
  InsertManyOptions,
  InsertManyResult
} from '@/src/client/types/insert/insert-many';
import {
  UpdateOneCommand,
  updateOneOptionKeys,
  UpdateOneOptions,
  UpdateOneResult,
} from '@/src/client/types/update/update-one';
import {
  UpdateManyCommand,
  updateManyOptionKeys,
  UpdateManyOptions,
  UpdateManyResult
} from '@/src/client/types/update/update-many';
import { DeleteOneCommand, DeleteOneOptions, DeleteOneResult } from '@/src/client/types/delete/delete-one';
import { DeleteManyCommand, DeleteManyResult } from '@/src/client/types/delete/delete-many';
import { FindOptions } from '@/src/client/types/find/find';
import { FindOneAndModifyResult } from '@/src/client/types/find/find-common';
import { FindOneCommand, FindOneOptions, findOneOptionsKeys } from '@/src/client/types/find/find-one';
import { FindOneAndDeleteCommand, FindOneAndDeleteOptions } from '@/src/client/types/find/find-one-delete';
import {
  FindOneAndUpdateCommand,
  FindOneAndUpdateOptions,
  findOneAndUpdateOptionsKeys
} from '@/src/client/types/find/find-one-update';
import {
  FindOneAndReplaceCommand,
  FindOneAndReplaceOptions,
  findOneAndReplaceOptionsKeys
} from '@/src/client/types/find/find-one-replace';
import { Filter } from '@/src/client/types/filter';
import { UpdateFilter } from '@/src/client/types/update-filter';
import { FoundDoc, NoId } from '@/src/client/types/utils';
import { SomeDoc } from '@/src/client/document';
import { FailedInsert, InsertManyBulkOptions, InsertManyBulkResult } from '@/src/client/types/insert/insert-many-bulk';
import { CollectionOptions } from '@/src/client/types/collections/create-collection';
import { Db } from '@/src/client/db';
import { FindCursorV2 } from '@/src/client/cursor-v2';
import { ToDotNotation } from '@/src/client/types/dot-notation';

type Flatten<Type> = Type extends ReadonlyArray<infer Item>
  ? Item
  : Type

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
export class Collection<Schema extends SomeDoc = SomeDoc> {
  private readonly _collectionName: string;
  private readonly _httpClient: HTTPClient;
  private readonly _db: Db

  constructor(db: Db, httpClient: HTTPClient, name: string) {
    if (!name) {
      throw new Error("collection name is required");
    }

    this._httpClient = httpClient.cloneShallow();
    this._httpClient.collection = name;

    this._collectionName = name;
    this._db = db;
  }

  /**
   * @return The name of the collection.
   */
  get collectionName(): string {
    return this._collectionName;
  }

  /**
   * @return The namespace (aka keyspace) of the parent database.
   */
  get namespace(): string {
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
   */
  async insertOne(document: Schema): Promise<InsertOneResult> {
    setDefaultIdForInsert(document);

    const command: InsertOneCommand = {
      insertOne: { document },
    }

    const resp = await this._httpClient.executeCommand(command);

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
  async insertMany(documents: Schema[], options?: InsertManyOptions): Promise<InsertManyResult> {
    documents.forEach(setDefaultIdForInsert);

    const command: InsertManyCommand = {
      insertMany: {
        documents,
        options,
      },
    };

    const resp = await this._httpClient.executeCommand(command, insertManyOptionKeys);

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

  async insertManyBulk(documents: Schema[], options?: InsertManyBulkOptions): Promise<InsertManyBulkResult<Schema>> {
    const parallel = (options?.ordered) ? 1 : (options?.parallel ?? 4);

    if (options?.ordered && options?.parallel && options?.parallel !== 1) {
      throw new Error('Parallel insert with ordered option is not supported');
    }

    if (parallel < 1) {
      throw new Error('Parallel must be greater than 0');
    }

    const results: InsertManyResult[] = [];
    const failedInserts: FailedInsert<Schema>[] = [];

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
          slice.forEach(setDefaultIdForInsert);

          const command: InsertManyCommand = {
            insertMany: {
              documents: slice,
              options,
            },
          };

          const resp = await this._httpClient.executeCommand(command, insertManyOptionKeys);

          results.push({
            acknowledged: true,
            insertedCount: resp.status?.insertedIds?.length || 0,
            insertedIds: resp.status?.insertedIds,
          });
        } catch (e: any) {
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
            } else {
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
      insertedIds: results.reduce((acc, r) => acc.concat(r.insertedIds), [] as string[]),
      failedCount: failedInserts.length,
      failedInserts,
    };
  }

  // async upsertOne(document: Schema): Promise<UpsertOneResult> {
  //   try {
  //     return {
  //       ...await this.insertOne(document),
  //       replaced: false,
  //     };
  //   } catch (e: any) {
  //     if (e.errors.length !== 1 || e.errors[0]?.errorCode !== 'DOCUMENT_ALREADY_EXISTS') {
  //       throw e;
  //     }
  //
  //     const resp = await this.findOneAndReplace({ _id: document._id }, document, { upsert: true });
  //
  //     return {
  //       acknowledged: true,
  //       insertedId: resp.value!._id,
  //       replaced: true,
  //     };
  //   }
  // }
  //
  // async upsertOneV2(document: Schema): Promise<UpsertOneResult> {
  //   setDefaultIdForInsert(document);
  //
  //   const command: FindOneAndReplaceCommand = {
  //     findOneAndReplace: {
  //       filter: { _id: document._id },
  //       options: { upsert: true },
  //       replacement: document,
  //     },
  //   };
  //
  //   const resp = await this._httpClient.executeCommand(command, findOneAndReplaceOptionsKeys);
  //
  //   return {
  //     acknowledged: true,
  //     insertedId: resp.data?.document?._id ?? resp.status?.upsertedId,
  //     replaced: !resp.status?.upsertedId
  //   };
  // }
  //
  // async upsertMany(documents: Schema[], options?: UpsertManyOptions): Promise<UpsertManyResult<Schema>> {
  //   const unique = nubByReverse(documents, '_id');
  //
  //   const resp = await this.insertManyBulk(unique, {
  //     chunkSize: options?.insertionChunkSize,
  //     parallel: options?.insertionParallel,
  //   });
  //
  //   const duplicated = resp.failedInserts.filter((f) => {
  //     return f.errors?.some((e: any) => e.errorCode === 'DOCUMENT_ALREADY_EXISTS');
  //   });
  //
  //   const workerChunkSize = Math.ceil(duplicated.length / (options?.upsertParallel ?? 8));
  //
  //   const upserted: UpsertOneResult[] = [];
  //   const failedUpserts: FailedInsert<Schema>[] = [];
  //
  //   const processQueue = async (i: number) => {
  //     const startIdx = i * workerChunkSize;
  //     const endIdx = (i + 1) * workerChunkSize;
  //
  //     for (let i = startIdx; i < Math.min(endIdx, documents.length); i ++) {
  //       const dup = duplicated[i];
  //
  //       try {
  //         const result = await this.upsertOneV2(dup.document);
  //         upserted.push(result);
  //       } catch (e: any) {
  //         failedUpserts.push({ document: dup.document, errors: e.errors });
  //       }
  //     }
  //   };
  //
  //   const workers = Array.from({ length: options?.upsertParallel ?? 8 }, (_, i) => {
  //     return processQueue(i);
  //   });
  //
  //   await Promise.all(workers);
  //
  //   return {
  //     acknowledged: true,
  //     insertedCount: resp.insertedCount,
  //     insertedIds: resp.insertedIds,
  //     modifiedIds: upserted.map((r) => r.insertedId),
  //     modifiedCount: upserted.length,
  //     failedCount: failedUpserts.length,
  //     failedUpserts: failedUpserts,
  //   };
  // }

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
  async updateOne(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: UpdateOneOptions<Schema>): Promise<UpdateOneResult> {
    const command: UpdateOneCommand = {
      updateOne: {
        filter,
        update,
        options: withoutFields(options, 'sort'),
      },
    };

    if (options?.sort) {
      command.updateOne.sort = options.sort;
    }

    setDefaultIdForUpsert(command.updateOne);

    const resp = await this._httpClient.executeCommand(command, updateOneOptionKeys);

    const commonResult = {
      modifiedCount: resp.status?.modifiedCount,
      matchedCount: resp.status?.matchedCount,
      acknowledged: true,
    } as const;

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
  async updateMany(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: UpdateManyOptions): Promise<UpdateManyResult> {
    const command: UpdateManyCommand = {
      updateMany: {
        filter,
        update,
        options,
      },
    };

    setDefaultIdForUpsert(command.updateMany);

    const updateManyResp = await this._httpClient.executeCommand(command, updateManyOptionKeys);

    if (updateManyResp.status?.moreData) {
      throw new AstraClientError(
        `More than ${updateManyResp.status?.modifiedCount} records found for update by the server`,
        command,
      );
    }

    const commonResult = {
      modifiedCount: updateManyResp.status?.modifiedCount,
      matchedCount: updateManyResp.status?.matchedCount,
      acknowledged: true,
    } as const;

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
  async deleteOne(filter: Filter<Schema> = {}, options?: DeleteOneOptions<Schema>): Promise<DeleteOneResult> {
    const command: DeleteOneCommand = {
      deleteOne: { filter },
    };

    if (options?.sort) {
      command.deleteOne.sort = options.sort;
    }

    const deleteOneResp = await this._httpClient.executeCommand(command);

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
   */
  async deleteMany(filter: Filter<Schema> = {}): Promise<DeleteManyResult> {
    const command: DeleteManyCommand = {
      deleteMany: { filter },
    };

    const deleteManyResp = await this._httpClient.executeCommand(command);

    if (deleteManyResp.status?.moreData) {
      throw new AstraClientError(`More records found to be deleted even after deleting ${deleteManyResp.status?.deletedCount} records`, command);
    }

    return {
      acknowledged: true,
      deletedCount: deleteManyResp.status?.deletedCount,
    };
  }

  async deleteManyBulk(filter: Filter<Schema> = {}): Promise<DeleteManyResult> {
    const command: DeleteManyCommand = {
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

  find<GetSim extends boolean = false>(filter: Filter<Schema>, options?: FindOptions<Schema, GetSim>): FindCursor<FoundDoc<Schema, GetSim>> {
    return new FindCursor(this._httpClient, filter, options) as any;
  }

  findV2<GetSim extends boolean = false>(filter: Filter<Schema>, options?: FindOptions<Schema, GetSim>): FindCursorV2<FoundDoc<Schema, GetSim>> {
    return new FindCursorV2(this.namespace, this._httpClient, filter, options) as any;
  }

  async distinct<Key extends keyof ToDotNotation<FoundDoc<Schema, GetSim>> & string, GetSim extends boolean = false>(key: Key, filter: Filter<Schema> = {}, _?: FindOptions<Schema, GetSim>): Promise<Flatten<ToDotNotation<FoundDoc<Schema, GetSim>>[Key]>[]> {
    const cursor = this.findV2<GetSim>(filter, { projection: { _id: 0, [key]: 1 } });

    const seen = new Set<unknown>();
    const path = key.split('.');

    for await (const doc of cursor) {
      let value = doc as any;
      console.log(doc);
      for (let i = 0, n = path.length; i < n; i++) {
        value = value[path[i]];
      }

      if (value !== undefined) {
        if (Array.isArray(value)) {
          for (let i = 0, n = value.length; i < n; i++) {
            seen.add(value[i]);
          }
        } else {
          seen.add(value);
        }
      }
    }

    return Array.from(seen) as any;
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
  async findOne<GetSim extends boolean = false>(filter: Filter<Schema>, options?: FindOneOptions<Schema, GetSim>): Promise<FoundDoc<Schema, GetSim> | null> {
    const command: FindOneCommand = {
      findOne: {
        filter,
        options: withoutFields(options, 'sort', 'projection'),
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

    const resp = await this._httpClient.executeCommand(command, findOneOptionsKeys);
    return resp.data?.document;
  }

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
  async findOneAndReplace(filter: Filter<Schema>, replacement: NoId<Schema>, options: FindOneAndReplaceOptions<Schema>): Promise<FindOneAndModifyResult<Schema>> {
    const command: FindOneAndReplaceCommand = {
      findOneAndReplace: {
        filter,
        replacement,
        options,
      },
    };

    setDefaultIdForUpsert(command.findOneAndReplace, true);

    if (options?.sort) {
      command.findOneAndReplace.sort = options.sort;
      delete options.sort;
    }

    const resp = await this._httpClient.executeCommand(command, findOneAndReplaceOptionsKeys);

    return {
      value: resp.data?.document,
      ok: 1,
    };
  }

  /**
   * @deprecated Use {@link countDocuments} instead
   */
  async count(filter?: Filter<Schema>): Promise<number> {
    return this.countDocuments(filter);
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
   * @param filter - A filter to select the documents to count. If not provided, all documents in the collection will be counted.
   */
  async countDocuments(filter?: Filter<Schema>): Promise<number> {
    const command = {
      countDocuments: { filter },
    };

    const resp = await this._httpClient.executeCommand(command);

    return resp.status?.count;
  }

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
  async findOneAndDelete(filter: Filter<Schema>, options?: FindOneAndDeleteOptions<Schema>): Promise<FindOneAndModifyResult<Schema>> {
    const command: FindOneAndDeleteCommand = {
      findOneAndDelete: { filter },
    };

    if (options?.sort) {
      command.findOneAndDelete.sort = options.sort;
    }

    const resp = await this._httpClient.executeCommand(command);

    return {
      value: resp.data?.document,
      ok: 1,
    };
  }

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
  async findOneAndUpdate(filter: Filter<Schema>, update: UpdateFilter<Schema>, options: FindOneAndUpdateOptions<Schema>): Promise<FindOneAndModifyResult<Schema>> {
    const command: FindOneAndUpdateCommand = {
      findOneAndUpdate: {
        filter,
        update,
        options,
      },
    };

    setDefaultIdForUpsert(command.findOneAndUpdate);

    if (options?.sort) {
      command.findOneAndUpdate.sort = options.sort;
      delete options.sort;
    }

    const resp = await this._httpClient.executeCommand(command, findOneAndUpdateOptionsKeys);

    return {
      value: resp.data?.document,
      ok: 1,
    };
  }

  /**
   * @return The options that the collection was created with (i.e. the `vector` and `indexing` operations).
   */
  async options(): Promise<CollectionOptions<SomeDoc>> {
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
  async drop(): Promise<boolean> {
    return await this._db.dropCollection(this._collectionName);
  }

  /**
   * @deprecated Use {@link collectionName} instead
   */
  get name(): string {
    return this._collectionName;
  }
}

export class AstraClientError extends Error {
  command: Record<string, any>;

  constructor(message: any, command: Record<string, any>) {
    const commandName = Object.keys(command)[0] || 'unknown';
    super(`Command "${commandName}" failed with the following error: ${message}`);
    this.command = command;
  }
}
