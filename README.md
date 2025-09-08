# Sheeter MCP Server

MCP server that enables Claude Desktop to interact with Google Sheets through the Sheeter API.

**Main Project**: [github.com/SarthakS97/sheeter](https://github.com/SarthakS97/sheeter)

## What it does

Connects Claude Desktop to Google Sheets via secure API, enabling:
- Create spreadsheets through conversation
- Read and analyze sheet data
- Write and update cells
- Append data to sheets
- Clear ranges and delete rows
- Get spreadsheet metadata
- Batch operations for efficiency

## Setup

### 1. Get API Key
Visit [sheeter-2.onrender.com](https://sheeter-2.onrender.com) and sign in with Google to get your API key.

### 2. Configure Claude Desktop
Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "sheeter": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-web"],
      "env": {
        "WEB_BASE_URL": "https://sheeter-2.onrender.com",
        "WEB_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 3. Use with Claude
Ask Claude to work with your spreadsheets:
- "Create a budget tracker spreadsheet"
- "Read data from my sales sheet"
- "Add this week's expenses to my tracker"
- "Analyze my project data and create a summary"

## Available Tools

- `create_spreadsheet` - Create new Google Spreadsheets
- `read_sheet` - Read data from sheets
- `write_sheet` - Update specific ranges
- `append_to_sheet` - Add data to end of sheets
- `clear_range` - Clear specific ranges
- `batch_get_ranges` - Read multiple ranges at once
- `batch_update_ranges` - Update multiple ranges
- `get_sheet_metadata` - Get spreadsheet information
- `delete_rows` - Remove specific rows
- `batch_update_spreadsheet` - Advanced operations

## Tech Stack

- TypeScript
- MCP SDK
- Sheeter API integration
- Deployed on Smithery

## Source

This MCP server is part of the larger Sheeter project: [github.com/SarthakS97/sheeter](https://github.com/SarthakS97/sheeter)
