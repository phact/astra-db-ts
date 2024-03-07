import { APIResponse, HTTPClient } from '../api';
import { Collection } from './collection';
import { TypeErr } from './utils';
import { CreateCollectionOptions } from './types/collections/create-collection';
import { SomeDoc } from './document';
import { CollectionInfo, ListCollectionsOptions } from './types/collections/list-collection';
import { BaseOptions } from './types/common';
/**
 * Represents an interface to some Astra database instance.
 *
 * **Shouldn't be instantiated directly, use {@link Client.db} to obtain an instance of this class.**
 *
 * @example
 * ```typescript
 * const db = client.db("my-db");
 * ```
 */
export declare class Db {
    private readonly _httpClient;
    private readonly _namespace;
    constructor(httpClient: HTTPClient, name: string);
    /**
     * @return The namespace (aka keyspace) of the database.
     */
    get namespace(): string;
    /**
     * Establishes a reference to a collection in the database. This method does not perform any I/O.
     *
     * **NB. This method does not validate the existence of the collection—it simply creates a reference.**
     *
     * **Unlike the MongoDB driver, this method does not create a collection if it doesn't exist.**
     *
     * Typed as `Collection<SomeDoc>` by default, but you can specify a schema type to get a typed collection.
     *
     * @example
     * ```typescript
     * interface User {
     *   name: string,
     *   age?: number,
     * }
     *
     * const users = db.collection<User>("users");
     * users.insertOne({ name: "John" });
     * ```
     *
     * @param name The name of the collection.
     *
     * @return A reference to the collection.
     *
     * @see Collection
     * @see SomeDoc
     */
    collection<Schema extends SomeDoc = SomeDoc>(name: string): Collection<Schema>;
    /**
     * Creates a new collection in the database.
     *
     * **NB. You are limited to 5 collections per database in Astra, so be wary when using this command.**
     *
     * Typed as `Collection<SomeDoc>` by default, but you can specify a schema type to get a typed collection.
     *
     * @example
     * ```typescript
     * interface User {
     *   name: string,
     *   age?: number,
     * }
     *
     * const users = await db.createCollection<User>("users");
     * users.insertOne({ name: "John" });
     * ```
     *
     * @param collectionName The name of the collection to create.
     * @param options Options for the collection.
     *
     * @return A promised reference to the newly created collection.
     *
     * @see Collection
     * @see SomeDoc
     */
    createCollection<Schema extends SomeDoc = SomeDoc>(collectionName: string, options?: CreateCollectionOptions<Schema>): Promise<Collection<Schema>>;
    /**
     * Drops a collection from the database.
     *
     * @param collectionName The name of the collection to drop.
     *
     * @param options Options for the operation.
     *
     * @return A promise that resolves to `true` if the collection was dropped successfully.
     */
    dropCollection(collectionName: string, options?: BaseOptions): Promise<boolean>;
    /**
     * Lists the collections in the database.
     *
     * Set `nameOnly` to `true` to only return the names of the collections.
     *
     * Otherwise, the method returns an array of objects with the collection names and their associated {@link CollectionOptions}.
     *
     * @example
     * ```typescript
     * const collections = await db.listCollections({ nameOnly: true });
     * console.log(collections); // [{ name: "users" }, { name: "posts" }]
     * ```
     *
     * @param options Options for the operation.
     *
     * @return A promise that resolves to an array of collection info.
     *
     * @see CollectionOptions
     */
    listCollections<NameOnly extends boolean = false>(options?: ListCollectionsOptions<NameOnly>): Promise<CollectionInfo<NameOnly>[]>;
    createDatabase(): Promise<APIResponse>;
    dropDatabase(): Promise<TypeErr<'Cannot drop database in Astra. Please use the Astra UI to drop the database.'>>;
    /**
     * @deprecated Use {@link _namespace} instead.
     */
    get name(): string;
}
