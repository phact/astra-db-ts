import { Db } from './db';
import { TypeErr } from './utils';
import { HTTPClientOptions } from '../api';
import { Collection } from './collection';
import { SomeDoc } from './document';
import { CollectionInfo } from './types/collections/list-collection';
import { CreateCollectionOptions } from './types/collections/create-collection';
export declare class Client implements Disposable {
    private readonly _httpClient;
    private readonly _namespace;
    private readonly _db;
    constructor(baseUrl: string, namespace: string, options: HTTPClientOptions);
    get namespace(): string;
    /**
     * Setup a connection to the Astra/Stargate JSON API
     * @param uri an Stargate JSON API uri (Eg. http://localhost:8181/v1/testks1) where testks1 is the name of the keyspace/Namespace which should always be the last part of the URL
     * @param options
     * @returns Client
     */
    static connect(uri: string, options?: HTTPClientOptions): Promise<Client>;
    collection<Schema extends SomeDoc = SomeDoc>(name: string): Promise<Collection<Schema>>;
    createCollection<Schema extends SomeDoc = SomeDoc>(collectionName: string, options?: CreateCollectionOptions<Schema>): Promise<Collection<Schema>>;
    dropCollection(collectionName: string): Promise<boolean>;
    listCollections<NameOnly extends boolean = false>(): Promise<CollectionInfo<NameOnly>[]>;
    db(dbName?: string): Db;
    setMaxListeners(maxListeners: number): number;
    close(): this;
    [Symbol.dispose](): void;
    /**
     * @deprecated use {@link namespace} instead
     */
    get keyspaceName(): string;
    startSession(): TypeErr<'startSession() not implemented'>;
}
