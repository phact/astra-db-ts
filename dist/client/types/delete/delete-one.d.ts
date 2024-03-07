import { InternalDeleteResult } from './delete-common';
import { SomeDoc, SortOption } from '../..';
import { BaseOptions } from '../common';
/**
 * Represents the options for the deleteOne command.
 *
 * @field sort - The sort order to pick which document to delete if the filter selects multiple documents.
 */
export interface DeleteOneOptions<Schema extends SomeDoc> extends BaseOptions {
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
 * Represents the result of a delete command.
 *
 * @field acknowledged - If the operation was acknowledged.
 * @field deletedCount - The number of deleted documents. Can be either 0 or 1.
 */
export type DeleteOneResult = InternalDeleteResult<0 | 1>;
