import { InternalUpdateResult } from './update-common';
import { SomeDoc, SortOption } from '../..';
import { BaseOptions } from '../common';
/**
 * Represents the options for the updateOne command.
 *
 * @field upsert - If true, perform an insert if no documents match the filter.
 * @field sort - The sort order to pick which document to update if the filter selects multiple documents.
 */
export interface UpdateOneOptions<Schema extends SomeDoc> extends BaseOptions {
    /**
     * If true, perform an insert if no documents match the filter.
     *
     * If false, do not insert if no documents match the filter.
     *
     * Defaults to false.
     * @default false
     */
    upsert?: boolean;
    /**
     * The order in which to apply the update if the filter selects multiple documents.
     *
     * If multiple documents match the filter, only one will be updated.
     *
     * Defaults to `null`, where the order is not guaranteed.
     * @default null
     */
    sort?: SortOption<Schema>;
}
/**
 * Represents the result of an updateOne operation.
 *
 * @example
 * ```typescript
 * const result = await collection.updateOne({
 *   _id: 'abc'
 * }, {
 *   $set: { name: 'John' }
 * }, {
 *   upsert: true
 * });
 *
 * if (result.upsertedCount) {
 *   console.log(`Document with ID ${result.upsertedId} was upserted`);
 * }
 * ```
 *
 * @field acknowledged - True if the operation was acknowledged.
 * @field matchedCount - The number of documents that matched the filter.
 * @field modifiedCount - The number of documents that were actually modified.
 * @field upsertedCount - The number of documents that were upserted.
 * @field upsertedId - The identifier of the upserted document if `upsertedCount > 0`.
 */
export type UpdateOneResult = InternalUpdateResult<0 | 1>;
