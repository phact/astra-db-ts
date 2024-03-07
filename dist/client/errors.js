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
exports.InsertManyOrderedError = exports.DataAPITimeout = exports.DataAPIError = void 0;
class DataAPIError extends Error {
    constructor(response, command) {
        const commandName = Object.keys(command)[0] || "unknown";
        const status = response.status ? `, status: ${JSON.stringify(response.status)}` : '';
        super(`Command "${commandName}" failed with the following errors: ${JSON.stringify(response.errors)}${status}`);
        this.errors = response.errors;
        this.status = response.status;
        this.data = response.data;
        this.command = command;
        this.name = "DataAPIError";
    }
}
exports.DataAPIError = DataAPIError;
class DataAPITimeout extends Error {
    constructor(command) {
        super("Command timed out");
        this.command = command;
        this.name = "DataAPITimeout";
    }
}
exports.DataAPITimeout = DataAPITimeout;
class InsertManyOrderedError extends Error {
    constructor(baseError, insertedIDs, failedInserts) {
        super(baseError.message);
        this.baseError = baseError;
        this.insertedIDs = insertedIDs;
        this.failedInserts = failedInserts;
        this.name = "InsertManyOrderedError";
    }
}
exports.InsertManyOrderedError = InsertManyOrderedError;
//# sourceMappingURL=errors.js.map