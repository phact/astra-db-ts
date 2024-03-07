"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstraDB = void 0;
const utils_1 = require("./utils");
const client_1 = require("./client");
const api_1 = require("../api");
class AstraDB extends client_1.Client {
    constructor(token, endpoint, keyspaceOrOptions, maybeOptions) {
        const keyspace = (typeof keyspaceOrOptions === 'string')
            ? keyspaceOrOptions
            : api_1.DEFAULT_KEYSPACE;
        if (!keyspace.match(/^[a-zA-Z0-9_]{1,48}$/)) {
            throw new Error('Invalid keyspace format; either pass a valid keyspace name, or don\t pass it at all to use the default keyspace');
        }
        const options = (typeof keyspaceOrOptions === 'string')
            ? maybeOptions
            : keyspaceOrOptions;
        super(endpoint, keyspace, {
            ...(0, utils_1.withoutFields)(options, 'keyspace'),
            baseApiPath: options?.baseApiPath ?? 'api/json/v1',
            applicationToken: token,
        });
    }
}
exports.AstraDB = AstraDB;
//# sourceMappingURL=astra.js.map