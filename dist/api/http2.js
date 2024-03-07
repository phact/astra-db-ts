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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP2Strategy = void 0;
const http2 = __importStar(require("http2"));
const http_client_1 = require("./http-client");
const errors_1 = require("../client/errors");
class HTTP2Strategy {
    constructor(baseURL) {
        this.closed = false;
        this.origin = new URL(baseURL).origin;
        this.session = this._reviveSession();
    }
    async request(info) {
        return new Promise((resolve, reject) => {
            if (this.closed) {
                throw new Error('Cannot make http2 request when client is closed');
            }
            // Recreate session if session was closed except via an explicit `close()`
            // call. This happens when nginx sends a GOAWAY packet after 1000 requests.
            if (this.session.closed) {
                this.session = this._reviveSession();
            }
            const timer = setTimeout(() => reject(new errors_1.DataAPITimeout(info.command)), info.timeout);
            const path = info.url.replace(this.origin, '');
            const params = info.params ? `?${new URLSearchParams(info.params).toString()}` : '';
            const req = this.session.request({
                ':path': path + params,
                ':method': info.method,
                token: info.token,
            });
            if (info.command) {
                req.write((0, http_client_1.serializeCommand)(info.command), 'utf8');
            }
            req.end();
            let status = 0;
            req.on('response', (data) => {
                clearTimeout(timer);
                status = data[':status'] ?? 0;
            });
            req.on('error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
            req.setEncoding('utf8');
            let responseBody = '';
            req.on('data', (chunk) => {
                responseBody += chunk;
            });
            req.on('end', () => {
                clearTimeout(timer);
                try {
                    const data = JSON.parse(responseBody);
                    resolve({ status, data });
                }
                catch (error) {
                    reject(new Error('Unable to parse response as JSON, got: "' + responseBody + '"'));
                }
            });
        });
    }
    close() {
        this.session.close();
        this.closed = true;
    }
    _reviveSession() {
        if (this.session && !this.session.closed) {
            return this.session;
        }
        const session = http2.connect(this.origin);
        // Without these handlers, any errors will end up as uncaught exceptions,
        // even if they are handled in `_request()`.
        // More info: https://github.com/nodejs/node/issues/16345
        session.on('error', () => { });
        session.on('socketError', () => { });
        return session;
    }
}
exports.HTTP2Strategy = HTTP2Strategy;
//# sourceMappingURL=http2.js.map