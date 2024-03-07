import { Client } from './client';
import { HTTPClientOptions } from '../api';
export interface AstraDBOptions extends Omit<HTTPClientOptions, 'applicationToken'> {
}
export declare class AstraDB extends Client {
    constructor(token: string, endpoint: string, options?: AstraDBOptions);
    constructor(token: string, endpoint: string, keyspace?: string, options?: AstraDBOptions);
}
