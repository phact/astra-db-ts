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
exports.serializeCommand = exports.handleIfErrorResponse = exports.HTTPClient = void 0;
const logger_1 = require("../logger");
const bson_1 = require("bson");
const constants_1 = require("./constants");
const http1_1 = require("./http1");
const http2_1 = require("./http2");
const errors_1 = require("../client/errors");
class HTTPClient {
    constructor(options) {
        if (typeof window !== "undefined") {
            throw new Error("not for use in a web browser");
        }
        if (!options.baseUrl) {
            throw new Error("baseUrl required for initialization");
        }
        if (!options.applicationToken) {
            throw new Error("applicationToken required for initialization");
        }
        this.baseUrl = options.baseUrl;
        this.applicationToken = options.applicationToken;
        this.logSkippedOptions = options.logSkippedOptions ?? false;
        this.collection = options.collectionName;
        this.keyspace = options.keyspaceName || constants_1.DEFAULT_KEYSPACE;
        this.usingHttp2 = options.useHttp2 ?? true;
        this.requestStrategy = (this.usingHttp2)
            ? new http2_1.HTTP2Strategy(this.baseUrl)
            : new http1_1.HTTP1Strategy;
        if (options.logLevel) {
            (0, logger_1.setLevel)(options.logLevel);
        }
        if (options.baseApiPath) {
            this.baseUrl += '/' + options.baseApiPath;
        }
    }
    close() {
        this.requestStrategy.close?.();
    }
    isClosed() {
        return this.requestStrategy.closed;
    }
    cloneShallow() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }
    async executeCommand(data, options, optionsToRetain) {
        const commandName = Object.keys(data)[0];
        if (data[commandName].options) {
            data[commandName].options = cleanupOptions(data, commandName, optionsToRetain, this.logSkippedOptions);
        }
        const response = await this.request({
            url: this.baseUrl,
            method: "POST" /* HTTP_METHODS.post */,
            timeout: options?.maxTimeMS ?? constants_1.DEFAULT_TIMEOUT,
            command: data,
        });
        handleIfErrorResponse(response, data);
        return response;
    }
    async request(requestInfo) {
        try {
            const keyspacePath = this.keyspace ? `/${this.keyspace}` : '';
            const collectionPath = this.collection ? `/${this.collection}` : '';
            const url = requestInfo.url + keyspacePath + collectionPath;
            const response = await this.requestStrategy.request({
                url: url,
                token: this.applicationToken,
                command: requestInfo.command,
                timeout: requestInfo.timeout || constants_1.DEFAULT_TIMEOUT,
                method: requestInfo.method || constants_1.DEFAULT_METHOD,
                params: requestInfo.params ?? {},
            });
            if (response.status === 401 || (response.data?.errors?.length > 0 && response.data?.errors[0]?.message === "UNAUTHENTICATED: Invalid token")) {
                return this._mkError("Authentication failed; is your token valid?");
            }
            if (response.status === 200) {
                return {
                    status: response.data?.status,
                    data: deserialize(response.data?.data),
                    errors: response.data?.errors,
                };
            }
            else {
                logger_1.logger.error(requestInfo.url + ": " + response.status);
                logger_1.logger.error("Data: " + JSON.stringify(requestInfo.command));
                return this._mkError("Server response received : " + response.status + "!");
            }
        }
        catch (e) {
            logger_1.logger.error(requestInfo.url + ": " + e.message);
            logger_1.logger.error("Data: " + JSON.stringify(requestInfo.command));
            if (e?.response?.data) {
                logger_1.logger.error("Response Data: " + JSON.stringify(e.response.data));
            }
            return this._mkError(e.message ? e.message : 'Server call failed, please retry!');
        }
    }
    _mkError(message) {
        return { errors: [{ message }] };
    }
}
exports.HTTPClient = HTTPClient;
function handleIfErrorResponse(response, data) {
    if (response.errors && response.errors.length > 0) {
        throw new errors_1.DataAPIError(response, data);
    }
}
exports.handleIfErrorResponse = handleIfErrorResponse;
function serializeCommand(data, pretty) {
    return bson_1.EJSON.stringify(data, (_, value) => handleValues(value), pretty ? "  " : "");
}
exports.serializeCommand = serializeCommand;
function deserialize(data) {
    return data ? bson_1.EJSON.deserialize(data) : data;
}
function handleValues(value) {
    if (value && typeof value === "bigint") {
        // BigInt handling
        return Number(value);
    }
    else if (value && typeof value === "object") {
        // ObjectId to strings
        if (value.$oid) {
            return value.$oid;
        }
        else if (value.$numberDecimal) {
            // Decimal128 handling
            return Number(value.$numberDecimal);
        }
        else if (value.$binary?.subType === "03" || value.$binary?.subType === "04") {
            // UUID handling. Subtype 03 or 04 is UUID. Refer spec : https://bsonspec.org/spec.html
            return Buffer.from(value.$binary.base64, "base64")
                .toString("hex")
                .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
        }
        // Date handling
        else if (value.$date) {
            // Use numbers instead of strings for dates
            value.$date = new Date(value.$date).valueOf();
        }
    }
    // all other values
    return value;
}
function cleanupOptions(data, commandName, optionsToRetain, logSkippedOptions) {
    const command = data[commandName];
    if (!command.options) {
        return undefined;
    }
    const options = { ...command.options };
    Object.keys(options).forEach((key) => {
        if (!optionsToRetain || !optionsToRetain.has(key)) {
            if (logSkippedOptions) {
                logger_1.logger.warn(`'${commandName}' does not support option '${key}'`);
            }
            delete options[key];
        }
    });
    return options;
}
//# sourceMappingURL=http-client.js.map