// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const configSchema = z.object({
  apiKey: z.string().describe("Your Sheeter API key (get it from https://sheeter-2.onrender.com)"),
  baseUrl: z.string().default("https://sheeter-2.onrender.com").describe("Sheeter API base URL"),
});

type Config = z.infer<typeof configSchema>;

// Add type definitions for API responses
interface CreateSpreadsheetResponse {
  success: boolean;
  spreadsheetId: string;
  spreadsheetUrl: string;
  message: string;
}

interface ReadSheetResponse {
  success: boolean;
  data: Record<string, string>[];
  headers: string[];
  rowCount: number;
}

async function callSheeterAPI(config: Config, endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${config.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${error}`);
  }

  return response.json();
}

export default function createServer({ config }: { config: Config }) {
  const server = new Server(
    {
      name: "Sheeter API",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "create_spreadsheet",
          description: "Create a new Google Spreadsheet",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Title for the new spreadsheet" },
            },
            required: ["title"],
          },
        },
        {
          name: "read_sheet",
          description: "Read data from a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              range: { type: "string", description: "A1 notation range", default: "A:Z" },
            },
            required: ["sheetId"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "create_spreadsheet": {
          const { title } = args as { title: string };
          const result = await callSheeterAPI(config, "/api/sheets/create", {
            method: "POST",
            body: JSON.stringify({ title }),
          }) as CreateSpreadsheetResponse;

          return {
            content: [
              {
                type: "text",
                text: `Created spreadsheet: "${title}"\nID: ${result.spreadsheetId}`,
              },
            ],
          };
        }

        case "read_sheet": {
          const { sheetId, range = "A:Z" } = args as { sheetId: string; range?: string };
          const queryParams = new URLSearchParams({ range });
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}?${queryParams}`) as ReadSheetResponse;

          return {
            content: [
              {
                type: "text",
                text: `Sheet data (${result.rowCount} rows):\nHeaders: ${result.headers.join(", ")}`,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}