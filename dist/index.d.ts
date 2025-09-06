import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
export declare const configSchema: z.ZodObject<{
    apiKey: z.ZodString;
    baseUrl: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    baseUrl: string;
}, {
    apiKey: string;
    baseUrl?: string | undefined;
}>;
type Config = z.infer<typeof configSchema>;
export default function createServer({ config }: {
    config: Config;
}): Server<{
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
        } | undefined;
    } | undefined;
}, {
    method: string;
    params?: {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | undefined;
}, {
    [x: string]: unknown;
    _meta?: {
        [x: string]: unknown;
    } | undefined;
}>;
export {};
