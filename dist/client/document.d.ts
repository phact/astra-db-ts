/**
 * Represents *some document*. It's not a base type, but rather more of a
 * bottom type which can represent any legal document, to give more dynamic
 * typing flexibility at the cost of enhanced typechecking/autocomplete.
 *
 * {@link Collection Collections} will default to this if no specific type is provided.
 */
export type SomeDoc = Record<string, any>;
/**
 * Base type for a document that wishes to leverage vector capabilities
 *
 * @example
 * ```
 * export interface Idea extends VectorDoc {
 *   idea: string,
 * }
 *
 * db.collection<Idea>('ideas').insertOne({
 *   idea: 'Upside down doors',
 *   $vector: [.23, .05, .95, .83, .42],
 * });
 * ```
 */
export interface VectorDoc {
    /**
     * A raw vector
     */
    $vector?: number[];
    /**
     * A string to be vectorized if the collection is configured with an embedding service
     */
    $vectorize?: string;
}
