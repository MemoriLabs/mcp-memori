# mcp-memori

> Persistent AI memory for any MCP-compatible agent — no SDK required.

**mcp-memori** is the official [Memori](https://memorilabs.ai) MCP server. Connect it to your AI agent to give it long-term memory: recall relevant facts before answering, store durable preferences after responding, and maintain context across sessions.

---

## Why Memori

Without persistent memory, every session starts from zero. With Memori, your agent:

- **Remembers preferences** — "I prefer Python and use `uv` for dependency management" is recalled in future sessions automatically
- **Personalizes responses** — past context shapes every answer without manual re-prompting
- **Isolates memory by user and workflow** — scoped per `entity_id` and `process_id` so preferences never bleed across users or projects
- **Works with any MCP client** — no SDK, no code changes, just config


## LoCoMo Benchmark

Memori was evaluated on the LoCoMo benchmark for long-conversation memory and achieved **81.95% overall accuracy** while using an average of **1,294 tokens per query**. That is just **4.97% of the full-context footprint**, showing that structured memory can preserve reasoning quality without forcing large prompts into every request.

Compared with other retrieval-based memory systems, Memori outperformed Zep, LangMem, and Mem0 while reducing prompt size by roughly **67% vs. Zep** and lowering context cost by more than **20x vs. full-context prompting**.

Read the [benchmark overview](https://memorilabs.ai/benchmark) or download the [paper](https://arxiv.org/abs/2603.19935).
---

## How It Works

The server exposes two tools:

| Tool | When to call | What it does |
|------|-------------|--------------|
| `recall` | Start of each user turn | Fetches relevant memories for the current query |
| `advanced_augmentation` | After composing a response | Stores durable facts and preferences for future sessions |

### Example Agent Flow

Given the message: *"I prefer Python and use uv for dependency management."*

1. Agent calls `recall` with the user message as `query`
2. Agent uses any returned facts to compose a response
3. Agent calls `advanced_augmentation` with the user message and response

On a later turn — *"Write a hello world script"* — the agent recalls the Python + `uv` preference and personalizes its response automatically.

---

## Prerequisites

- A Memori API key from [app.memorilabs.ai](https://app.memorilabs.ai)
- An `entity_id` to identify the end user (e.g. `user_123`)
- An optional `process_id` to identify the agent or workflow (e.g. `my_agent`)

Export these in your shell or replace the placeholders directly in your config:

```bash
export MEMORI_API_KEY="your-memori-api-key"
export MEMORI_ENTITY_ID="user_123"
export MEMORI_PROCESS_ID="my_agent"   # optional
```

---

## Client Setup

### Claude Code

**Via CLI:**

```bash
claude mcp add --transport http memori https://api.memorilabs.ai/mcp/ \
  --header "X-Memori-API-Key: ${MEMORI_API_KEY}" \
  --header "X-Memori-Entity-Id: ${MEMORI_ENTITY_ID}" \
  --header "X-Memori-Process-Id: ${MEMORI_PROCESS_ID}"
```

**Via `.mcp.json`** (project root):

```json
{
  "mcpServers": {
    "memori": {
      "type": "http",
      "url": "https://api.memorilabs.ai/mcp/",
      "headers": {
        "X-Memori-API-Key": "${MEMORI_API_KEY}",
        "X-Memori-Entity-Id": "${MEMORI_ENTITY_ID}",
        "X-Memori-Process-Id": "${MEMORI_PROCESS_ID}"
      }
    }
  }
}
```

Run `/mcp` inside Claude Code to verify the server status.

---

### Cursor

Create `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project-level):

```json
{
  "mcpServers": {
    "memori": {
      "url": "https://api.memorilabs.ai/mcp/",
      "headers": {
        "X-Memori-API-Key": "${MEMORI_API_KEY}",
        "X-Memori-Entity-Id": "${MEMORI_ENTITY_ID}",
        "X-Memori-Process-Id": "${MEMORI_PROCESS_ID}"
      }
    }
  }
}
```

Restart Cursor after saving.

---

### OpenAI Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.memori]
enabled = true
url = "https://api.memorilabs.ai/mcp/"

[mcp_servers.memori.http_headers]
X-Memori-API-Key = "${MEMORI_API_KEY}"
X-Memori-Entity-Id = "${MEMORI_ENTITY_ID}"
X-Memori-Process-Id = "${MEMORI_PROCESS_ID}"
```

You can also add the server from the Codex UI: **Settings > MCP Servers > + Add Server**.

---

### Warp

Add to your Warp MCP configuration:

```json
{
  "memori": {
    "serverUrl": "https://api.memorilabs.ai/mcp/",
    "headers": {
      "X-Memori-API-Key": "your-memori-api-key",
      "X-Memori-Entity-Id": "user_123",
      "X-Memori-Process-Id": "my_agent"
    }
  }
}
```

---

### Antigravity

Open **Manage MCP Servers** and edit `mcp_config.json`:

```json
{
  "mcpServers": {
    "memori": {
      "serverUrl": "https://api.memorilabs.ai/mcp/",
      "headers": {
        "X-Memori-API-Key": "your-memori-api-key",
        "X-Memori-Entity-Id": "user_123",
        "X-Memori-Process-Id": "my_agent"
      }
    }
  }
}
```

Save and restart Antigravity to refresh the tools list.

---

### LangChain

```python
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "memori": {
        "transport": "streamable_http",
        "url": "https://api.memorilabs.ai/mcp/",
        "headers": {
            "X-Memori-API-Key": "your-memori-api-key",
            "X-Memori-Entity-Id": "user_123",
            "X-Memori-Process-Id": "langchain_agent"
        }
    }
})

tools = await client.get_tools()
```

---

### Slack

Set headers dynamically per request using the Slack user ID from the event payload:

```ts
const memoriHeaders = {
  "X-Memori-API-Key": process.env.MEMORI_API_KEY,
  "X-Memori-Entity-Id": slackEvent.user,   // e.g. "U04ABCDEF"
  "X-Memori-Process-Id": "supportbot",
};
```

Pass these headers in every MCP tool call. Use `process_id` to isolate memories by workspace so preferences from personal workspaces don't bleed into team ones.

---

### Notion

Set entity and process IDs from the Notion API user object:

```ts
const memoriHeaders = {
  "X-Memori-API-Key": process.env.MEMORI_API_KEY,
  "X-Memori-Entity-Id": notionUser.id,
  "X-Memori-Process-Id": "notion_writing_assistant",
};
```

---

## Server Details

| Property | Value |
|----------|-------|
| Endpoint | `https://api.memorilabs.ai/mcp/` |
| Transport | Stateless HTTP |
| Auth | API key via request headers |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `X-Memori-API-Key` | Yes | Your Memori API key |
| `X-Memori-Entity-Id` | Yes | Stable end-user identifier (e.g. `user_123`) |
| `X-Memori-Process-Id` | No | Process, app, or workflow identifier for memory isolation |

`session_id` is derived automatically as `<entity_id>-<UTC year-month-day:hour>` — you do not need to provide it.

---

## Verifying the Connection

After configuring any client:

1. Confirm the MCP server shows as **connected** in your client's UI
2. Check that `recall` and `advanced_augmentation` appear in the tools list
3. Send a test message — `recall` should return a response (even if empty for new entities)
4. Verify `advanced_augmentation` returns `memory being created`

If you receive `401` errors, double-check your `X-Memori-API-Key` value. See the [Troubleshooting guide](https://memorilabs.ai/docs/memori-cloud/support/troubleshooting) for more help.

---

## Links

- [Memori Cloud](https://memorilabs.ai)
- [Get an API key](https://app.memorilabs.ai)
- [MCP Overview docs](https://memorilabs.ai/docs/memori-cloud/mcp/overview)
- [Client Setup docs](https://memorilabs.ai/docs/memori-cloud/mcp/client-setup)
