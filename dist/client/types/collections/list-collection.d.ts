import { SomeDoc } from '../..';
import { CollectionOptions } from './collection-options';
import { BaseOptions } from '../common';
/**
 * Options for listing collections.
 *
 * @field nameOnly - If true, only the name of the collection is returned. If false, the full collection info is returned. Defaults to false.
 */
export interface ListCollectionsOptions<NameOnly extends boolean> extends BaseOptions {
    /**
     * If true, only the name of the collection is returned.
     *
     * If false, the full collection info is returned.
     *
     * Defaults to false.
     *
     * @example
     * ```typescript
     * const names = await db.listCollections({ nameOnly: true });
     * console.log(names); // [{ name: 'my-coll' }]
     *
     * const info = await db.listCollections({ nameOnly: false });
     * console.log(info); // [{ name: 'my-coll', options: { ... } }]
     * ```
     *
     * @default false
     */
    nameOnly?: NameOnly;
}
/**
 * Result of listing collections depending on if `nameOnly` is true or false.
 *
 * If `nameOnly` is true, an array of collection names is returned.
 *
 * If `nameOnly` is false, an array of collection info is returned.
 *
 * @example
 * ```typescript
 * const names = await db.listCollections({ nameOnly: true });
 * console.log(names); // [{ name: 'my-coll' }]
 *
 * const info = await db.listCollections();
 * console.log(info); // [{ name: 'my-coll', options: { ... } }]
 * ```
 */
export type CollectionInfo<NameOnly extends boolean> = NameOnly extends true ? Pick<FullCollectionInfo, 'name'> : FullCollectionInfo;
/**
 * Information about a collection.
 *
 * @field name - The name of the collection.
 * @field options - The creation options for the collection.
 */
interface FullCollectionInfo {
    /**
     * The name of the collection.
     */
    name: string;
    /**
     * The creation options for the collection (i.e. the `vector` and `indexing` fields).
     */
    options: CollectionOptions<SomeDoc>;
}
export {};
