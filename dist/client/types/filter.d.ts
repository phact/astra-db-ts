import { ToDotNotation } from './dot-notation';
import { IsDate, IsNum } from './utils';
import { SomeDoc } from '../document';
/**
 * Represents some filter operation for a given document schema.
 *
 * Disclaimer: It's strongly typed if a strict schema is passed in, but if
 * {@link SomeDoc} is used, operators (like `$and`) are no longer typechecked
 *
 * @example
 * ```
 * interface BasicSchema {
 *   arr: string[],
 *   num: number,
 * }
 *
 * db.collection<BasicSchema>('coll_name').findOne({
 *   $and: [
 *     { _id: { $in: ['abc', 'def'] } },
 *     { $not: { arr: { $size: 0 } } },
 *   ]
 * });
 * ```
 */
export type Filter<Schema extends SomeDoc> = {
    [K in keyof ToDotNotation<Schema>]?: FilterExpr<ToDotNotation<Schema>[K]>;
} & {
    _id?: FilterExpr<string>;
    $and?: Filter<Schema>[];
    $or?: Filter<Schema>[];
    $not?: Filter<Schema>;
};
/**
 * Represents an expression in a filter statement, such as an exact value, or a filter operator
 */
type FilterExpr<Elem> = Elem | FilterOps<Elem>;
/**
 * Represents filter operators such as `$eq` and `$in` (but not statements like `$and`)
 */
type FilterOps<Elem> = {
    $eq?: Elem;
    $ne?: Elem;
    $in?: Elem[];
    $nin?: Elem[];
    $exists?: boolean;
} & (IsNum<Elem> extends false ? {} : NumFilterOps) & (IsDate<Elem> extends false ? {} : DateFilterOps) & (any[] extends Elem ? ArrayFilterOps<Elem> : {});
/**
 * Represents filter operations exclusive to number (or dynamically typed) fields
 */
interface NumFilterOps {
    $lt?: number | bigint;
    $lte?: number | bigint;
    $gt?: number | bigint;
    $gte?: number | bigint;
}
/**
 * Represents filter operations exclusive to Dates (or dynamically typed) fields
 */
interface DateFilterOps {
    $lt?: Date | {
        $date: number;
    };
    $lte?: Date | {
        $date: number;
    };
    $gt?: Date | {
        $date: number;
    };
    $gte?: Date | {
        $date: number;
    };
}
/**
 * Represents filter operations exclusive to array (or dynamically typed) fields
 */
interface ArrayFilterOps<Elem> {
    $size?: number;
    $all?: Elem;
}
export {};
