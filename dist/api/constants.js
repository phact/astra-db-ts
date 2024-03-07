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
exports.DEFAULT_TIMEOUT = exports.DEFAULT_AUTH_HEADER = exports.DEFAULT_METHOD = exports.DEFAULT_KEYSPACE = exports.REQUESTED_WITH = void 0;
const version_1 = require("../version");
exports.REQUESTED_WITH = version_1.LIB_NAME + "/" + version_1.LIB_VERSION;
exports.DEFAULT_KEYSPACE = 'default_keyspace';
exports.DEFAULT_METHOD = "GET" /* HTTP_METHODS.get */;
exports.DEFAULT_AUTH_HEADER = process.env['ASTRA_AUTH_HEADER'] || "Token";
exports.DEFAULT_TIMEOUT = 30000;
//# sourceMappingURL=constants.js.map