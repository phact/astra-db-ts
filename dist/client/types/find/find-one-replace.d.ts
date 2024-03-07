import { SomeDoc } from '../..';
import { BaseOptions, SortOption } from '../common';
/**
 * Represents the options for the `findOneAndReplace` command.
 *
 * @field returnDocument - Specifies whether to return the original or updated document.
 * @field upsert - If true, perform an insert if no documents match the filter.
 * @field sort - The sort order to pick which document to replace if the filter selects multiple documents.
 */
export interface FindOneAndReplaceOptions<Schema extends SomeDoc> extends BaseOptions {
    /**
     * Specifies whether to return the document before or after the update.
     *
     * Set to `before` to return the document before the update to see the original state of the document.
     *
     * Set to `after` to return the document after the update to see the updated state of the document immediately.
     */
    returnDocument: 'before' | 'after';
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
    includeResultMetadata?: boolean;
}
