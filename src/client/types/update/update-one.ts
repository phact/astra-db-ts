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

import { InternalUpdateResult } from '@/src/client/types/update/update-common';
import { SomeDoc, SortOption } from '@/src/client';

export interface UpdateOneCommand {
  updateOne: {
    filter: Record<string, unknown>;
    update: Record<string, any>;
    options?: UpdateOneOptions<any>;
    sort?: SortOption<any>;
  }
}

export interface UpdateOneOptions<Schema extends SomeDoc> {
  upsert?: boolean;
  sort?: SortOption<Schema>;
}

export const updateOneOptionKeys = new Set(['upsert', 'sort']);

export type UpdateOneResult = InternalUpdateResult<0 | 1>;