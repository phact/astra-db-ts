/**
 * Represents the result of a delete command.
 *
 * @field acknowledged - If the operation was acknowledged.
 * @field deletedCount - The number of deleted documents.
 */
export interface InternalDeleteResult<N extends number> {
    /**
     * True if the operation was acknowledged.
     */
    acknowledged: true;
    /**
     * The number of deleted documents.
     */
    deletedCount: N;
}
