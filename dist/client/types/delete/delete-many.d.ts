import { InternalDeleteResult } from './delete-common';
/**
 * Represents the result of a delete command.
 *
 * @field acknowledged - If the operation was acknowledged.
 * @field deletedCount - The number of deleted documents. Can be any non-negative integer.
 */
export type DeleteManyResult = InternalDeleteResult<number>;
