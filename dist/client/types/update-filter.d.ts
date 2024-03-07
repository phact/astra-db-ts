import { ToDotNotation } from './dot-notation';
import { IsNum } from './utils';
import { TypeErr } from '../utils';
import { SomeDoc } from '../document';
/**
 * Represents the update filter to specify how to update a document.
 *
 * @example
 * ```typescript
 * const updateFilter: UpdateFilter<SomeDoc> = {
 *   $set: {
 *     'customer.name': 'Jim B.'
 *   },
 *   $unset: {
 *     'customer.phone': ''
 *   },
 *   $inc: {
 *     'customer.age': 1
 *   },
 * }
 * ```
 *
 * @field $set - Set the value of a field in the document.
 * @field $setOnInsert - Set the value of a field in the document if an upsert is performed.
 * @field $unset - Remove the field from the document.
 * @field $inc - Increment the value of a field in the document.
 * @field $push - Add an element to an array field in the document.
 * @field $pop - Remove an element from an array field in the document.
 * @field $rename - Rename a field in the document.
 * @field $currentDate - Set the value of a field to the current date.
 * @field $min - Only update the field if the specified value is less than the existing value.
 * @field $max - Only update the field if the specified value is greater than the existing value.
 * @field $mul - Multiply the value of a field in the document.
 * @field $addToSet - Add an element to an array field in the document if it does not already exist.
 */
export interface UpdateFilter<Schema extends SomeDoc, InNotation = ToDotNotation<Schema>> {
    /**
     * Set the value of a field in the document.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $set: {
     *     'customer.name': 'Jim B.'
     *   }
     * }
     * ```
     */
    $set?: Partial<InNotation>;
    /**
     * Set the value of a field in the document if an upsert is performed.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $setOnInsert: {
     *     'customer.name': 'Jim B.'
     *   }
     * }
     * ```
     */
    $setOnInsert?: Partial<InNotation>;
    /**
     * Remove the field from the document.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $unset: {
     *     'customer.phone': ''
     *   }
     * }
     * ```
     */
    $unset?: Unset<InNotation>;
    /**
     * Increment the value of a field in the document if it's potentially a `number`.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $inc: {
     *     'customer.age': 1
     *   }
     * }
     * ```
     */
    $inc?: NumberUpdate<InNotation>;
    /**
     * Add an element to an array field in the document.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $push: {
     *     'items': 'Extended warranty - 5 years'
     *   }
     * }
     * ```
     */
    $push?: Push<InNotation>;
    /**
     * Remove an element from an array field in the document.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $pop: {
     *     'items': -1
     *   }
     * }
     * ```
     */
    $pop?: Pop<InNotation>;
    /**
     * Rename a field in the document.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $rename: {
     *     'customer.name': 'client.name'
     *   }
     * }
     * ```
     */
    $rename?: Rename<InNotation>;
    /**
     * Set the value of a field to the current date.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $currentDate: {
     *     'purchase_date': true
     *   }
     * }
     * ```
     */
    $currentDate?: CurrentDate<InNotation>;
    /**
     * Only update the field if the specified value is less than the existing value.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $min: {
     *     'customer.age': 18
     *   }
     * }
     * ```
     */
    $min?: NumberUpdate<InNotation>;
    /**
     * Only update the field if the specified value is greater than the existing value.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $max: {
     *     'customer.age': 65
     *   }
     * }
     * ```
     */
    $max?: NumberUpdate<InNotation>;
    /**
     * Multiply the value of a field in the document.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $mul: {
     *     'customer.age': 1.1
     *   }
     * }
     * ```
     */
    $mul?: NumberUpdate<InNotation>;
    /**
     * Add an element to an array field in the document if it does not already exist.
     *
     * @example
     * ```typescript
     * const updateFilter: UpdateFilter<SomeDoc> = {
     *   $addToSet: {
     *     'items': 'Extended warranty - 5 years'
     *   }
     * }
     * ```
     */
    $addToSet?: Push<InNotation>;
}
type Unset<Schema> = {
    [K in keyof Schema]?: '';
};
type Pop<Schema> = ContainsArr<Schema> extends true ? {
    [K in keyof ArrayUpdate<Schema>]?: number;
} : TypeErr<'Can not pop on a schema with no arrays'>;
type Push<Schema> = ContainsArr<Schema> extends true ? {
    [K in keyof ArrayUpdate<Schema>]?: (ArrayUpdate<Schema>[K] | {
        $each: ArrayUpdate<Schema>[K][];
        $position?: number;
    });
} : TypeErr<'Can not perform array operation on a schema with no arrays'>;
type Rename<Schema> = {
    [K in keyof Schema]?: string;
};
type NumberUpdate<Schema> = ContainsNum<Schema> extends true ? {
    [K in keyof Schema as IsNum<Schema[K]> extends true ? K : never]?: number | bigint;
} : TypeErr<'Can not perform a number operation on a schema with no numbers'>;
type ArrayUpdate<Schema> = {
    [K in keyof Schema as any[] extends Schema[K] ? K : never]?: PickArrayTypes<Schema[K]>;
};
type CurrentDate<Schema> = {
    [K in keyof Schema as Schema[K] extends Date ? K : never]?: boolean;
};
type ContainsArr<Schema> = any[] extends Schema[keyof Schema] ? true : false;
type ContainsNum<Schema> = IsNum<Schema[keyof Schema]>;
type PickArrayTypes<Schema> = Extract<Schema, any[]> extends (infer E)[] ? E : unknown;
export {};
