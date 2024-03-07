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
exports.HTTP1Strategy = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
const http_1 = __importDefault(require("http"));
const logger_1 = require("../logger");
const http_client_1 = require("./http-client");
const axiosAgent = axios_1.default.create({
    headers: {
        "Accepts": "application/json",
        "Content-Type": "application/json",
        "User-Agent": `${constants_1.REQUESTED_WITH} ${axios_1.default.defaults.headers.common["User-Agent"]}`,
        "X-Requested-With": constants_1.REQUESTED_WITH,
    },
    // keepAlive pools and reuses TCP connections
    httpAgent: new http_1.default.Agent({
        keepAlive: true,
    }),
    timeout: constants_1.DEFAULT_TIMEOUT,
});
axiosAgent.interceptors.request.use((config) => {
    const { method, url } = config;
    if (logger_1.logger.isLevelEnabled("http")) {
        logger_1.logger.http(`--- request ${method?.toUpperCase()} ${url} ${(0, http_client_1.serializeCommand)(config.data, true)}`);
    }
    config.data = (0, http_client_1.serializeCommand)(config.data);
    return config;
});
axiosAgent.interceptors.response.use((response) => {
    if (logger_1.logger.isLevelEnabled("http")) {
        logger_1.logger.http(`--- response ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} ${JSON.stringify(response.data, null, 2)}`);
    }
    return response;
});
class HTTP1Strategy {
    async request(info) {
        return await axiosAgent({
            url: info.url,
            data: info.command,
            params: info.params,
            method: info.method || constants_1.DEFAULT_METHOD,
            timeout: info.timeout || constants_1.DEFAULT_TIMEOUT,
            headers: {
                [constants_1.DEFAULT_AUTH_HEADER]: info.token,
            }
        });
    }
}
exports.HTTP1Strategy = HTTP1Strategy;
//# sourceMappingURL=http1.js.map