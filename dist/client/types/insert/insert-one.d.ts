/**
 * Represents the result of an insertOne command.
 *
 * @field acknowledged - If the operation was acknowledged.
 * @field insertedId - The ID of the inserted document.
 */
export interface InsertOneResult {
    /**
     * True if the operation was acknowledged.
     */
    acknowledged: true;
    /**
     * The ID of the inserted document (this will be an autogenerated ID if one was not provided).
     */
    insertedId: string;
}
