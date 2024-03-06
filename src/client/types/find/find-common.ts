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

import { SomeDoc } from '@/src/client/document';

/**
 * Represents the result of a `findOneAnd*` operation (e.g. `findOneAndUpdate`)
 *
 * @field value - The document that was found and modified.
 * @field ok - If the operation was acknowledged.
 */
export interface FindOneAndModifyResult<Schema extends SomeDoc> {
  /**
   * The document that was found and modified, or `null` if nothing matched.
   */
  value: Schema | null;
  /**
   * If the operation was ok.
   */
  ok: number;
}
