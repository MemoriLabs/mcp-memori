# Memori MCP Server

A stdio MCP server that bridges to the [Memori](https://memorilabs.ai) API for persistent AI memory.

[![mcp-memori MCP server](https://glama.ai/mcp/servers/MemoriLabs/mcp-memori/badges/card.svg)](https://glama.ai/mcp/servers/MemoriLabs/mcp-memori)

## Tools

- **recall** — Retrieve relevant memories for a query
- **advanced_augmentation** — Store durable facts and preferences across sessions

## Setup

### Environment Variables

Required:

- `MEMORI_API_KEY` — Your Memori API key
- `MEMORI_ENTITY_ID` — Stable end-user/entity ID

Optional:

- `MEMORI_PROCESS_ID` — Process/app/workflow ID
- `MEMORI_API_URL` — API endpoint (defaults to `https://api.memorilabs.ai/mcp`)

### Install and Run

```bash
npm install
npm run build
```

### Usage with Claude Code

```bash
claude mcp add memori -- npx mcp-memori
```

Or add to `.mcp.json`:

```json
{
  "mcpServers": {
    "memori": {
      "command": "npx",
      "args": ["mcp-memori"],
      "env": {
        "MEMORI_API_KEY": "your-api-key",
        "MEMORI_ENTITY_ID": "your-entity-id",
        "MEMORI_PROCESS_ID": "your-process-id"
      }
    }
  }
}
```

### Usage with Cursor

Add to `~/.cursor/mcp.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "memori": {
      "command": "npx",
      "args": ["mcp-memori"],
      "env": {
        "MEMORI_API_KEY": "your-api-key",
        "MEMORI_ENTITY_ID": "your-entity-id",
        "MEMORI_PROCESS_ID": "your-process-id"
      }
    }
  }
}
```

## Publishing to MCP Registry

```bash
npm run build
npm publish --access public
mcp-publisher init
mcp-publisher login github
mcp-publisher publish
```