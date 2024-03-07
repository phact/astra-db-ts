import { SomeDoc } from '../document';
/**
 * Converts some {@link Schema} into a type representing its dot notation (object paths).
 *
 * @example
 * ```
 * interface BasicSchema {
 *   num: number,
 *   arr: string[],
 *   obj: {
 *     nested: string,
 *     someDoc: SomeDoc,
 *   }
 * }
 *
 * interface BasicSchemaInDotNotation {
 *   'num': number,
 *   'arr': string[],
 *   'obj': { nested: string, someDoc: SomeDoc }
 *   'obj.nested': string,
 *   'obj.someDoc': SomeDoc,
 *   [`obj.someDoc.${string}`]: any,
 * }
 * ```
 */
export type ToDotNotation<Schema extends SomeDoc> = Merge<_ToDotNotation<Required<Schema>, ''>>;
type _ToDotNotation<Elem extends SomeDoc, Prefix extends string> = {
    [Key in keyof Elem]: SomeDoc extends Elem ? ((Prefix extends '' ? never : {
        [Path in CropTrailingDot<Prefix>]: Elem;
    }) | {
        [Path in `${Prefix}${string}`]: any;
    }) : Elem[Key] extends any[] ? {
        [Path in `${Prefix}${Key & string}`]: Elem[Key];
    } : Elem[Key] extends Date ? {
        [Path in `${Prefix}${Key & string}`]: Date | {
            $date: number;
        };
    } : Elem[Key] extends SomeDoc ? ({
        [Path in `${Prefix}${Key & string}`]: Elem[Key];
    } | _ToDotNotation<Elem[Key], `${Prefix}${Key & string}.`>) : {
        [Path in `${Prefix}${Key & string}`]: Elem[Key];
    };
}[keyof Elem] extends infer Value ? Value : never;
type CropTrailingDot<Str extends string> = Str extends `${infer T}.` ? T : Str;
type Merge<Ts> = Expand<UnionToIntersection<Ts>>;
type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends ((arg: infer I) => void) ? I : never;
type Expand<T> = T extends infer O ? {
    [K in keyof O]: O[K];
} : never;
export {};
