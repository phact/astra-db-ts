// Copyright DataStax, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Db } from './db';
import { createAstraUri, parseUri, TypeErr } from './utils';
import { HTTPClient, HTTPClientOptions } from '@/src/api';
import { Collection } from './collection';
import { CreateCollectionOptions } from '@/src/client/operations/collections/create-collection';
import { SomeDoc } from '@/src/client/document';

export type ClientOptions = HTTPClientOptions;

export class Client implements Disposable {
  httpClient: HTTPClient;
  keyspace?: string;

  constructor(baseUrl: string, keyspaceName: string, options: ClientOptions) {
    this.keyspace = keyspaceName;

    if (!options.applicationToken) {
      throw new Error('Application Token is required');
    }

    this.httpClient = new HTTPClient({
      baseApiPath: options.baseApiPath,
      baseUrl: baseUrl,
      applicationToken: options.applicationToken,
      logLevel: options.logLevel,
      logSkippedOptions: options.logSkippedOptions,
      useHttp2: options.useHttp2,
      keyspaceName: keyspaceName,
    });
  }

  /**
   * Setup a connection to the Astra/Stargate JSON API
   * @param uri an Stargate JSON API uri (Eg. http://localhost:8181/v1/testks1) where testks1 is the name of the keyspace/Namespace which should always be the last part of the URL
   * @param options
   * @returns Client
   */
  static async connect(
    uri: string,
    options?: ClientOptions | null,
  ): Promise<Client> {
    const parsedUri = parseUri(uri);

    return new Client(parsedUri.baseUrl, parsedUri.keyspaceName, {
      applicationToken: options?.applicationToken || parsedUri.applicationToken,
      baseApiPath: options?.baseApiPath || parsedUri.baseApiPath,
      logLevel: options?.logLevel,
      logSkippedOptions: options?.logSkippedOptions,
    });
  }

  async collection<Schema extends SomeDoc = SomeDoc>(name: string) {
    return new Collection<Schema>(this.httpClient, name);
  }

  async createCollection<Schema extends SomeDoc = SomeDoc>(collectionName: string, options?: CreateCollectionOptions<Schema>) {
    return await this.db().createCollection(collectionName, options);
  }

  async dropCollection(collectionName: string) {
    return await this.db().dropCollection(collectionName);
  }

  db(dbName?: string) {
    if (dbName) {
      return new Db(this.httpClient, dbName);
    }
    if (this.keyspace) {
      return new Db(this.httpClient, this.keyspace);
    }
    throw new Error("Database name must be provided");
  }

  setMaxListeners(maxListeners: number) {
    return maxListeners;
  }

  close() {
    this.httpClient.close();
    return this;
  }

  [Symbol.dispose]() {
    this.close();
  }

  // noinspection JSUnusedGlobalSymbols
  startSession(): TypeErr<'startSession() Not Implemented'> {
    throw new Error('startSession() Not Implemented');
  }
}

const DEFAULT_KEYSPACE = 'default_keyspace';

export class AstraDB extends Client {
  constructor(...args: any[]) {
    // token: string, API EndPoint: string, keyspace?: string
    const keyspaceName = args[2] || DEFAULT_KEYSPACE;
    const endpoint = createAstraUri(args[1], keyspaceName);
    super(endpoint, keyspaceName, { applicationToken: args[0] });
  }
}