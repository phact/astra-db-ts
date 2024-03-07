import { SomeDoc } from '../..';
import { ProjectionOption, SortOption } from '../common';
export interface FindOptions<Schema extends SomeDoc, GetSim extends boolean> {
    sort?: SortOption<Schema>;
    projection?: ProjectionOption<Schema>;
    limit?: number;
    skip?: number;
    includeSimilarity?: GetSim;
    batchSize?: number;
}
export interface InternalFindOptions {
    pagingState?: string;
    limit?: number;
    skip?: number;
    includeSimilarity?: boolean;
}
export interface InternalGetMoreCommand {
    find: {
        filter?: Record<string, unknown>;
        options?: InternalFindOptions;
        sort?: Record<string, unknown>;
        projection?: Record<string, unknown>;
    };
}
export declare const internalFindOptionsKeys: Set<string>;
