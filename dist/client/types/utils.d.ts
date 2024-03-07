/**
 * Checks if a type can possibly be some number
 *
 * @example
 * ```
 * IsNum<string | number> === true
 * ```
 */
export type IsNum<T> = number extends T ? true : bigint extends T ? true : false;
/**
 * Checks if a type can possibly be a date
 *
 * @example
 * ```
 * IsDate<string | Date> === boolean
 * ```
 */
export type IsDate<T> = T extends Date ? true : false;
/**
 * Forces the given type to include an `_id`
 */
export type WithId<T> = Omit<T, '_id'> & {
    _id: string;
};
/**
 * Includes a `$similarity` field if the typeparam `GetSim` is `true`
 */
type WithSim<T, GetSim extends boolean> = GetSim extends true ? Omit<T, '$similarity'> & {
    $similarity: number;
} : Omit<T, '$similarity'> & {
    $similarity: undefined;
};
/**
 * Shorthand type for `WithSim` & `WithId`
 */
export type FoundDoc<Doc, GetSim extends boolean> = WithSim<WithId<Doc>, GetSim>;
/**
 * Represents a doc that doesn't have an `_id`
 */
export type NoId<Doc> = Omit<Doc, '_id'>;
/**
 * Represents a flattened version of the given type. Only goes one level deep.
 */
export type Flatten<Type> = Type extends (infer Item)[] ? Item : Type;
export {};
