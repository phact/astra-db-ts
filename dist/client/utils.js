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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withoutFields = exports.setDefaultIdForUpsert = exports.setDefaultIdForInsert = exports.dropNamespace = exports.createNamespace = exports.createAstraUri = exports.getKeyspaceName = exports.parseUri = void 0;
const url_1 = __importDefault(require("url"));
const http_client_1 = require("../api/http-client");
const bson_1 = require("bson");
// Parse a connection URI in the format of: https://${baseUrl}/${baseAPIPath}/${keyspace}?applicationToken=${applicationToken}
const parseUri = (uri) => {
    const parsedUrl = url_1.default.parse(uri, true);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
    const keyspaceName = parsedUrl.pathname?.substring(parsedUrl.pathname?.lastIndexOf("/") + 1);
    const baseApiPath = getBaseAPIPath(parsedUrl.pathname);
    const applicationToken = parsedUrl.query?.applicationToken;
    const logLevel = parsedUrl.query?.logLevel;
    if (!keyspaceName) {
        throw new Error("Invalid URI: keyspace is required");
    }
    return {
        baseUrl,
        baseApiPath,
        keyspaceName,
        applicationToken,
        logLevel,
    };
};
exports.parseUri = parseUri;
// Removes the last part of the api path (which is assumed as the keyspace name). for example below are the sample input => output from this function
// /v1/testks1 => v1
// /apis/v1/testks1 => apis/v1
// /testks1 => '' (empty string)
function getBaseAPIPath(pathFromUrl) {
    if (!pathFromUrl) {
        return "";
    }
    const pathElements = pathFromUrl.split("/");
    pathElements[pathElements.length - 1] = "";
    const baseApiPath = pathElements.join("/");
    return baseApiPath === "/"
        ? ""
        : baseApiPath.substring(1, baseApiPath.length - 1);
}
// Get the keyspace name from the path
function getKeyspaceName(pathFromUrl) {
    if (!pathFromUrl) {
        return "";
    }
    const pathElements = pathFromUrl.split("/");
    return pathElements[pathElements.length - 1];
}
exports.getKeyspaceName = getKeyspaceName;
/**
 * Create an Astra connection URI while connecting to Astra JSON API
 * @param apiEndPoint the API EndPoint of the Astra database
 * @param keyspace the keyspace to connect to
 * @param applicationToken an Astra application token
 * @param baseApiPath baseAPI path defaults to /api/json/v1
 * @param logLevel an winston log level (error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6)
 * @returns URL as string
 */
function createAstraUri(apiEndPoint, keyspace, applicationToken, baseApiPath, logLevel) {
    const uri = new url_1.default.URL(apiEndPoint);
    let contextPath = "";
    contextPath += baseApiPath ? `/${baseApiPath}` : "/api/json/v1";
    contextPath += `/${keyspace}`;
    uri.pathname = contextPath;
    if (applicationToken) {
        uri.searchParams.append("applicationToken", applicationToken);
    }
    if (logLevel) {
        uri.searchParams.append("logLevel", logLevel);
    }
    return uri.toString();
}
exports.createAstraUri = createAstraUri;
async function createNamespace(httpClient, name) {
    const data = {
        createNamespace: { name },
    };
    (0, exports.parseUri)(httpClient.baseUrl);
    const response = await httpClient.request({
        url: httpClient.baseUrl,
        method: "POST" /* HTTP_METHODS.post */,
        command: data,
    });
    (0, http_client_1.handleIfErrorResponse)(response, data);
    return response;
}
exports.createNamespace = createNamespace;
async function dropNamespace(httpClient, name) {
    const data = {
        dropNamespace: { name },
    };
    const response = await httpClient.request({
        url: httpClient.baseUrl,
        method: "POST" /* HTTP_METHODS.post */,
        command: data,
    });
    (0, http_client_1.handleIfErrorResponse)(response, data);
    return response;
}
exports.dropNamespace = dropNamespace;
function setDefaultIdForInsert(document) {
    document._id ?? (document._id = genObjectId());
}
exports.setDefaultIdForInsert = setDefaultIdForInsert;
function setDefaultIdForUpsert(command, replace) {
    var _a;
    if (!command.filter || "_id" in command.filter) {
        return;
    }
    if (!command.options || !command.options.upsert) {
        return;
    }
    if (replace) {
        if (command.replacement && "_id" in command.replacement) {
            return;
        }
        command.replacement ?? (command.replacement = {});
        command.replacement._id = genObjectId();
        return;
    }
    if (command.update && fieldHasKey(command.update, "_id")) {
        return;
    }
    command.update ?? (command.update = {});
    (_a = command.update).$setOnInsert ?? (_a.$setOnInsert = {});
    if (!("_id" in command.update.$setOnInsert)) {
        command.update.$setOnInsert._id = genObjectId();
    }
}
exports.setDefaultIdForUpsert = setDefaultIdForUpsert;
function genObjectId() {
    return new bson_1.ObjectId().toString();
}
function fieldHasKey(update, key) {
    return Object.keys(update).some((operator) => (update[operator] &&
        typeof update[operator] === 'object' &&
        key in update[operator]));
}
function withoutFields(obj, ...fields) {
    if (!obj) {
        return obj;
    }
    const newObj = { ...obj };
    for (const field of fields) {
        delete newObj[field];
    }
    return newObj;
}
exports.withoutFields = withoutFields;
//# sourceMappingURL=utils.js.map