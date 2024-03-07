import { SomeDoc } from '../../document';
import { WithId } from '../utils';
/**
 * Represents the result of a `findOneAnd*` operation (e.g. `findOneAndUpdate`)
 *
 * @field value - The document that was found and modified.
 * @field ok - If the operation was acknowledged.
 */
export interface ModifyResult<Schema extends SomeDoc> {
    /**
     * The document that was found and modified, or `null` if nothing matched.
     */
    value: WithId<Schema> | null;
    /**
     * If the operation was ok.
     */
    ok: number;
}
