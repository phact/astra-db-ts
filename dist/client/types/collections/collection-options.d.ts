import { SomeDoc } from '../..';
import { IndexingOptions, VectorOptions } from './create-collection';
/**
 * Represents the options for the createCollection command.
 *
 * @field vector - Options related to vector search.
 * @field indexing - Options related to indexing.
 */
export interface CollectionOptions<Schema extends SomeDoc> {
    /**
     * Options related to vector search.
     */
    vector?: VectorOptions;
    /**
     * Options related to indexing.
     */
    indexing?: IndexingOptions<Schema>;
}
