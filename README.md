# Memori MCP

> Persistent AI memory for any MCP-compatible agent — no SDK required.

**memori-mcp** is the official [Memori](https://memorilabs.ai) MCP server. Connect it to your AI agent to give it long-term memory: recall relevant facts before answering, store durable preferences after responding, and maintain context across sessions.

---

## Why Memori MCP?

Memori turns stateless agents into **stateful systems** by providing structured, persistent memory that works across sessions and workflows.

1. **Persistent state beyond prompts** — Most agents rely on prompt context and lose state between runs. Memori provides **durable, structured memory** so agents can retain facts, decisions, and outcomes over time.
2. **Memory from execution (not just natural language)** — Traditional systems extract memory from chat. Memori builds memory from **agent execution itself** — including tool calls, decisions, and results. This enables true **agent-native memory**, not just conversational recall.
3. **Lower cost, higher accuracy** — Instead of expanding prompt context, Memori retrieves only what matters.
   - Significantly reduced token usage
   - Faster responses
   - Improved accuracy vs long-context approaches
4. **Works with any MCP client and production-ready** - No SDK, no code changes, just config

Memori is **state infrastructure for production agents** — enabling persistent memory, efficient retrieval, and structured context across both natural language and agent execution.


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

- [Memori Cloud](https://memorilabs.ai/docs/memori-cloud)
- [Get an API key](https://app.memorilabs.ai)
- [MCP Overview docs](https://memorilabs.ai/docs/memori-cloud/mcp/overview)
- [Client Setup docs](https://memorilabs.ai/docs/memori-cloud/mcp/client-setup)
