"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const db_1 = require("./db");
const utils_1 = require("./utils");
const api_1 = require("../api");
class Client {
    constructor(baseUrl, namespace, options) {
        this._namespace = namespace;
        if (!options.applicationToken) {
            throw new Error('Application Token is required');
        }
        this._httpClient = new api_1.HTTPClient({
            baseUrl: baseUrl,
            keyspaceName: namespace,
            ...options,
        });
        this._db = new db_1.Db(this._httpClient, namespace);
    }
    get namespace() {
        return this._namespace;
    }
    /**
     * Setup a connection to the Astra/Stargate JSON API
     * @param uri an Stargate JSON API uri (Eg. http://localhost:8181/v1/testks1) where testks1 is the name of the keyspace/Namespace which should always be the last part of the URL
     * @param options
     * @returns Client
     */
    static async connect(uri, options) {
        const parsedUri = (0, utils_1.parseUri)(uri);
        return new Client(parsedUri.baseUrl, parsedUri.keyspaceName, {
            applicationToken: options?.applicationToken || parsedUri.applicationToken,
            baseApiPath: options?.baseApiPath || parsedUri.baseApiPath,
            logLevel: options?.logLevel,
            logSkippedOptions: options?.logSkippedOptions,
        });
    }
    async collection(name) {
        return this.db().collection(name);
    }
    async createCollection(collectionName, options) {
        return await this.db().createCollection(collectionName, options);
    }
    async dropCollection(collectionName) {
        return await this.db().dropCollection(collectionName);
    }
    async listCollections() {
        return await this.db().listCollections();
    }
    db(dbName) {
        if (dbName) {
            return new db_1.Db(this._httpClient, dbName);
        }
        if (this._db) {
            return this._db;
        }
        throw new Error("Database name must be provided");
    }
    // ????
    setMaxListeners(maxListeners) {
        return maxListeners;
    }
    close() {
        this._httpClient.close();
        return this;
    }
    [Symbol.dispose]() {
        this.close();
    }
    /**
     * @deprecated use {@link namespace} instead
     */
    get keyspaceName() {
        return this._namespace;
    }
    // noinspection JSUnusedGlobalSymbols
    startSession() {
        throw new Error('startSession() not implemented');
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map