import { ToDotNotation } from '../dot-notation';
import { SomeDoc } from '../../document';
import { BaseOptions } from '../common';
import { CollectionOptions } from './collection-options';
export interface CreateCollectionOptions<Schema extends SomeDoc> extends BaseOptions, CollectionOptions<Schema> {
}
/**
 * Represents the options for the vector search.
 *
 * @field dimension - The dimension of the vectors.
 * @field metric - The similarity metric to use for the vector search.
 * @field service - Options related to the vectorization pipeline, to specify an embedding service.
 */
export interface VectorOptions {
    /**
     * The dimension of the vectors stored in the collection.
     */
    dimension: number;
    /**
     * The similarity metric to use for the vector search.
     *
     * See [intro to vector databases](https://docs.datastax.com/en/astra/astra-db-vector/get-started/concepts.html#metrics) for more details.
     */
    metric: 'cosine' | 'euclidean' | 'dot_product';
    /**
     * Options related to the vectorization pipeline, to specify an embedding service. WIP.
     */
    service?: Record<string, unknown>;
}
/**
 * Represents the options for the indexing.
 *
 * **Only one of `allow` or `deny` can be specified.**
 *
 * See [indexing](https://docs.datastax.com/en/astra/astra-db-vector/api-reference/data-api-commands.html#advanced-feature-indexing-clause-on-createcollection) for more details.
 *
 * @field allow - The fields to index.
 * @field deny - The fields to not index.
 */
export type IndexingOptions<Schema extends SomeDoc> = {
    allow: (keyof ToDotNotation<Schema>)[] | ['*'];
    deny?: never;
} | {
    deny: (keyof ToDotNotation<Schema>)[] | ['*'];
    allow?: never;
};
