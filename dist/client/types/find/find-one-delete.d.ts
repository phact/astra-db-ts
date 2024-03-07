import { SomeDoc } from '../..';
import { BaseOptions, SortOption } from '../common';
/**
 * Represents the options for the `findOneAndDelete` command.
 *
 * @field sort - The sort order to pick which document to delete if the filter selects multiple documents.
 */
export interface FindOneAndDeleteOptions<Schema extends SomeDoc> extends BaseOptions {
    /**
     * The order in which to apply the update if the filter selects multiple documents.
     *
     * If multiple documents match the filter, only one will be updated.
     *
     * Defaults to `null`, where the order is not guaranteed.
     * @default null
     */
    sort?: SortOption<Schema>;
    includeResultMetadata?: boolean;
}
