import { InternalUpdateResult } from './update-common';
import { BaseOptions } from '../common';
/**
 * Represents the options for the updateMany command.
 *
 * @field upsert - If true, perform an insert if no documents match the filter.
 */
export interface UpdateManyOptions extends BaseOptions {
    /**
     * If true, perform an insert if no documents match the filter.
     *
     * If false, do not insert if no documents match the filter.
     *
     * Defaults to false.
     * @default false
     */
    upsert?: boolean;
}
/**
 * Represents the result of an updateMany operation.
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
export type UpdateManyResult = InternalUpdateResult<number>;
