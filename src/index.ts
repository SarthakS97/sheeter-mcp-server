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

// Type definitions for API responses
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
  range: string;
  values: string[][];
}

interface UpdateResponse {
  success: boolean;
  updatedCells: number;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
}

interface AppendResponse {
  success: boolean;
  updates: {
    updatedCells: number;
    updatedRange: string;
  };
}

interface ClearResponse {
  success: boolean;
  clearedRange: string;
}

interface MetadataResponse {
  success: boolean;
  spreadsheetId: string;
  properties: {
    title: string;
    locale: string;
    timeZone: string;
  };
  sheets: Array<{
    sheetId: number;
    title: string;
    gridProperties: {
      rowCount: number;
      columnCount: number;
    };
  }>;
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
              range: { type: "string", description: "A1 notation range (e.g., A1:D10)", default: "A:Z" },
              majorDimension: { type: "string", enum: ["ROWS", "COLUMNS"], default: "ROWS" },
              valueRenderOption: { type: "string", enum: ["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"], default: "FORMATTED_VALUE" },
            },
            required: ["sheetId"],
          },
        },
        {
          name: "write_sheet",
          description: "Update values in a single range of a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              range: { type: "string", description: "A1 notation range (e.g., A1:B2)" },
              values: {
                type: "array",
                description: "2D array of values to write",
                items: { type: "array", items: { type: "string" } },
              },
              valueInputOption: { type: "string", enum: ["RAW", "USER_ENTERED"], default: "USER_ENTERED" },
            },
            required: ["sheetId", "range", "values"],
          },
        },
        {
          name: "append_to_sheet",
          description: "Append values to the end of a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              values: {
                type: "array",
                description: "2D array of values to append",
                items: { type: "array", items: { type: "string" } },
              },
              valueInputOption: { type: "string", enum: ["RAW", "USER_ENTERED"], default: "USER_ENTERED" },
            },
            required: ["sheetId", "values"],
          },
        },
        {
          name: "clear_range",
          description: "Clear values from a specific range in a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              range: { type: "string", description: "A1 notation range to clear (e.g., A1:B10)" },
            },
            required: ["sheetId", "range"],
          },
        },
        {
          name: "batch_get_ranges",
          description: "Read values from multiple ranges in a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              ranges: {
                type: "array",
                description: "List of A1 notation ranges",
                items: { type: "string" },
              },
              majorDimension: { type: "string", enum: ["ROWS", "COLUMNS"], default: "ROWS" },
              valueRenderOption: { type: "string", enum: ["FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"], default: "FORMATTED_VALUE" },
            },
            required: ["sheetId", "ranges"],
          },
        },
        {
          name: "batch_update_ranges",
          description: "Update values in multiple ranges of a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              data: {
                type: "array",
                description: "List of ranges and their values to update",
                items: {
                  type: "object",
                  properties: {
                    range: { type: "string" },
                    values: { type: "array", items: { type: "array", items: { type: "string" } } },
                  },
                  required: ["range", "values"],
                },
              },
              valueInputOption: { type: "string", enum: ["RAW", "USER_ENTERED"], default: "USER_ENTERED" },
            },
            required: ["sheetId", "data"],
          },
        },
        {
          name: "get_sheet_metadata",
          description: "Get information about a Google Spreadsheet including sheets and properties",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
            },
            required: ["sheetId"],
          },
        },
        {
          name: "delete_rows",
          description: "Delete specific rows from a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              startIndex: { type: "number", description: "Start index of rows to delete (0-based)" },
              endIndex: { type: "number", description: "End index of rows to delete (exclusive, 0-based)" },
              sheetTabId: { type: "number", description: "ID of the sheet tab (0 for first sheet)", default: 0 },
            },
            required: ["sheetId", "startIndex", "endIndex"],
          },
        },
        {
          name: "batch_update_spreadsheet",
          description: "Perform complex operations like find/replace, formatting, adding sheets, etc.",
          inputSchema: {
            type: "object",
            properties: {
              sheetId: { type: "string", description: "Google Spreadsheet ID" },
              requests: {
                type: "array",
                description: "Array of batch update requests (find/replace, formatting, etc.)",
                items: { type: "object" },
              },
            },
            required: ["sheetId", "requests"],
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
                text: `Successfully created spreadsheet: "${title}"\nSpreadsheet ID: ${result.spreadsheetId}\nURL: ${result.spreadsheetUrl}`,
              },
            ],
          };
        }

        case "read_sheet": {
          const { sheetId, range = "A:Z", majorDimension = "ROWS", valueRenderOption = "FORMATTED_VALUE" } = args as {
            sheetId: string;
            range?: string;
            majorDimension?: string;
            valueRenderOption?: string;
          };
          
          const queryParams = new URLSearchParams({ range, majorDimension, valueRenderOption });
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}?${queryParams}`) as ReadSheetResponse;

          const dataText = result.data?.length > 0 
            ? result.data.slice(0, 10).map((row, idx) => 
                `Row ${idx + 1}: ${Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(", ")}`
              ).join("\n") + (result.data.length > 10 ? `\n... and ${result.data.length - 10} more rows` : "")
            : "No data found";

          return {
            content: [
              {
                type: "text",
                text: `Sheet Data from ${result.range} (${result.rowCount} rows):\n\nHeaders: ${result.headers?.join(", ") || "No headers"}\n\nData:\n${dataText}`,
              },
            ],
          };
        }

        case "write_sheet": {
          const { sheetId, range, values, valueInputOption = "USER_ENTERED" } = args as {
            sheetId: string;
            range: string;
            values: string[][];
            valueInputOption?: string;
          };
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/values`, {
            method: "PUT",
            body: JSON.stringify({ range, values, valueInputOption }),
          }) as UpdateResponse;

          return {
            content: [
              {
                type: "text",
                text: `Successfully updated ${result.updatedCells} cells in range ${result.updatedRange}\nUpdated ${result.updatedRows} rows and ${result.updatedColumns} columns`,
              },
            ],
          };
        }

        case "append_to_sheet": {
          const { sheetId, values, valueInputOption = "USER_ENTERED" } = args as {
            sheetId: string;
            values: string[][];
            valueInputOption?: string;
          };
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/append`, {
            method: "POST",
            body: JSON.stringify({ values, valueInputOption }),
          }) as AppendResponse;

          return {
            content: [
              {
                type: "text",
                text: `Successfully appended ${result.updates.updatedCells} cells to the sheet\nData added to range: ${result.updates.updatedRange}`,
              },
            ],
          };
        }

        case "clear_range": {
          const { sheetId, range } = args as { sheetId: string; range: string };
          const queryParams = new URLSearchParams({ range });
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/values?${queryParams}`, {
            method: "DELETE",
          }) as ClearResponse;

          return {
            content: [
              {
                type: "text",
                text: `Successfully cleared range ${result.clearedRange}`,
              },
            ],
          };
        }

        case "batch_get_ranges": {
          const { sheetId, ranges, majorDimension = "ROWS", valueRenderOption = "FORMATTED_VALUE" } = args as {
            sheetId: string;
            ranges: string[];
            majorDimension?: string;
            valueRenderOption?: string;
          };
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/batch-get`, {
            method: "POST",
            body: JSON.stringify({ ranges, majorDimension, valueRenderOption }),
          });

          const rangeResults = result.valueRanges?.map((vr: any, idx: number) => 
            `Range ${idx + 1} (${vr.range}): ${vr.values?.length || 0} rows`
          ).join("\n") || "No ranges returned";

          return {
            content: [
              {
                type: "text",
                text: `Batch get completed for ${ranges.length} ranges:\n\n${rangeResults}`,
              },
            ],
          };
        }

        case "batch_update_ranges": {
          const { sheetId, data, valueInputOption = "USER_ENTERED" } = args as {
            sheetId: string;
            data: Array<{ range: string; values: string[][] }>;
            valueInputOption?: string;
          };
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/batch-update`, {
            method: "PUT",
            body: JSON.stringify({ data, valueInputOption }),
          });

          return {
            content: [
              {
                type: "text",
                text: `Batch update completed:\nTotal updated cells: ${result.totalUpdatedCells}\nTotal updated ranges: ${data.length}`,
              },
            ],
          };
        }

        case "get_sheet_metadata": {
          const { sheetId } = args as { sheetId: string };
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/metadata`) as MetadataResponse;

          const sheetsInfo = result.sheets?.map(sheet => 
            `• ${sheet.title} (ID: ${sheet.sheetId}, ${sheet.gridProperties.rowCount} rows × ${sheet.gridProperties.columnCount} cols)`
          ).join("\n") || "No sheets found";

          return {
            content: [
              {
                type: "text",
                text: `Spreadsheet: ${result.properties.title}\nSpreadsheet ID: ${result.spreadsheetId}\nLocale: ${result.properties.locale}\nTime Zone: ${result.properties.timeZone}\n\nSheets:\n${sheetsInfo}`,
              },
            ],
          };
        }

        case "delete_rows": {
          const { sheetId, startIndex, endIndex, sheetTabId = 0 } = args as {
            sheetId: string;
            startIndex: number;
            endIndex: number;
            sheetTabId?: number;
          };
          
          const queryParams = new URLSearchParams({
            startIndex: startIndex.toString(),
            endIndex: endIndex.toString(),
            sheetTabId: sheetTabId.toString(),
          });
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/rows?${queryParams}`, {
            method: "DELETE",
          });

          return {
            content: [
              {
                type: "text",
                text: `Successfully deleted rows from index ${startIndex} to ${endIndex - 1} (${endIndex - startIndex} rows total)`,
              },
            ],
          };
        }

        case "batch_update_spreadsheet": {
          const { sheetId, requests } = args as {
            sheetId: string;
            requests: object[];
          };
          
          const result = await callSheeterAPI(config, `/api/sheets/${sheetId}/batch-update-spreadsheet`, {
            method: "POST",
            body: JSON.stringify({ requests }),
          });

          return {
            content: [
              {
                type: "text",
                text: `Batch spreadsheet operation completed successfully\nProcessed ${requests.length} requests\nOperation details available in spreadsheet`,
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