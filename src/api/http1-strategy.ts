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

import { HTTPRequestStrategy, InternalAPIResponse, InternalHTTPRequestInfo } from '@/src/api/types';
import axios from 'axios';
import { DEFAULT_AUTH_HEADER, DEFAULT_METHOD, DEFAULT_TIMEOUT, REQUESTED_WITH } from '@/src/api/constants';
import http from 'http';
import { logger } from '@/src/logger';
import { serializeCommand } from '@/src/api/http-client';

const axiosAgent = axios.create({
  headers: {
    "Accepts": "application/json",
    "Content-Type": "application/json",
    "User-Agent": `${REQUESTED_WITH} ${axios.defaults.headers.common["User-Agent"]}`,
    "X-Requested-With": REQUESTED_WITH,
  },
  // keepAlive pools and reuses TCP connections
  httpAgent: new http.Agent({
    keepAlive: true,
  }),
  timeout: DEFAULT_TIMEOUT,
});

axiosAgent.interceptors.request.use((config) => {
  const { method, url } = config;

  if (logger.isLevelEnabled("http")) {
    logger.http(`--- request ${method?.toUpperCase()} ${url} ${serializeCommand(config.data, true,)}`,);
  }

  config.data = serializeCommand(config.data);
  return config;
});

axiosAgent.interceptors.response.use((response) => {
  if (logger.isLevelEnabled("http")) {
    logger.http(`--- response ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} ${JSON.stringify(response.data, null, 2)}`,);
  }
  return response;
});

export class HTTP1Strategy implements HTTPRequestStrategy {
  async request(info: InternalHTTPRequestInfo): Promise<InternalAPIResponse> {
    return await axiosAgent({
      url: info.url,
      data: info.data,
      params: info.params,
      method: info.method || DEFAULT_METHOD,
      timeout: info.timeout || DEFAULT_TIMEOUT,
      headers: {
        [DEFAULT_AUTH_HEADER]: info.token,
      }
    });
  }
}