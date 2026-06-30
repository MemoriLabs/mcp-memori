#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";

const MEMORI_API_URL =
  process.env.MEMORI_API_URL || "https://api.memorilabs.ai/mcp";

let remoteClient: Client | null = null;

async function getRemoteClient(): Promise<Client> {
  if (remoteClient) return remoteClient;

  const apiKey = process.env.MEMORI_API_KEY;
  const entityId = process.env.MEMORI_ENTITY_ID;
  const processId = process.env.MEMORI_PROCESS_ID;

  if (!apiKey) {
    throw new Error("MEMORI_API_KEY environment variable is required");
  }
  if (!entityId) {
    throw new Error("MEMORI_ENTITY_ID environment variable is required");
  }

  const headers: Record<string, string> = {
    "X-Memori-API-Key": apiKey,
    "X-Memori-Entity-Id": entityId,
  };
  if (processId) {
    headers["X-Memori-Process-Id"] = processId;
  }

  const transport = new StreamableHTTPClientTransport(
    new URL(MEMORI_API_URL),
    { requestInit: { headers } },
  );

  remoteClient = new Client({ name: "memori-bridge", version: "1.1.0" });
  await remoteClient.connect(transport);
  return remoteClient;
}

function makeErrorContent(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

const server = new McpServer({
  name: "memori",
  version: "1.1.0",
});

// memori_recall — fetch targeted memories at the start of a turn
server.registerTool(
  "memori_recall",
  {
    title: "Recall Memories",
    description:
      "Retrieve relevant memories for a given query. Call at the start of user turns to fetch prior context, preferences, facts, decisions, and constraints.",
    inputSchema: {
      query: z
        .string()
        .describe("The user message or search query to recall memories for"),
      projectId: z.string().optional().describe("Optional project scope"),
      sessionId: z.string().optional().describe("Optional session scope"),
      dateStart: z.string().optional().describe("ISO date range start"),
      dateEnd: z.string().optional().describe("ISO date range end"),
      source: z
        .enum([
          "constraint",
          "decision",
          "execution",
          "fact",
          "insight",
          "instruction",
          "status",
          "strategy",
          "task",
        ])
        .optional()
        .describe("Memory source type — must be paired with signal"),
      signal: z
        .enum([
          "commit",
          "discovery",
          "failure",
          "inference",
          "pattern",
          "result",
          "update",
          "verification",
        ])
        .optional()
        .describe("Memory signal — must be paired with source"),
    },
  },
  async (args) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_recall",
        arguments: args,
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "No memories found" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error recalling memories: ${message}`);
    }
  },
);

// memori_recall_summary — broad memory state for session starts and overviews
server.registerTool(
  "memori_recall_summary",
  {
    title: "Recall Memory Summary",
    description:
      "Fetch broad memory state for session starts, daily briefs, status updates, and project overviews. Use when a high-level snapshot of prior context is needed rather than a targeted recall.",
    inputSchema: {
      projectId: z.string().optional().describe("Optional project scope"),
      sessionId: z.string().optional().describe("Optional session scope"),
      dateStart: z.string().optional().describe("ISO date range start"),
      dateEnd: z.string().optional().describe("ISO date range end"),
    },
  },
  async (args) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_recall_summary",
        arguments: args,
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "No memory summary available" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error fetching memory summary: ${message}`);
    }
  },
);

// memori_compaction — restore working state after context compaction
server.registerTool(
  "memori_compaction",
  {
    title: "Post-Compaction Memory Brief",
    description:
      "Fetch a structured post-compaction brief so the agent can resume operational work after context compaction or a long-running workflow loses conversational detail. Not a replacement for precise recall — use memori_recall for targeted search.",
    inputSchema: {
      projectId: z.string().optional().describe("Optional project scope"),
      sessionId: z.string().optional().describe("Optional session scope"),
      numMessages: z
        .number()
        .optional()
        .describe("Number of recent messages to include for continuity"),
    },
  },
  async (args) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_compaction",
        arguments: args,
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "No compaction state available" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error fetching compaction brief: ${message}`);
    }
  },
);

// memori_advanced_augmentation — store durable memory after responding
server.registerTool(
  "memori_advanced_augmentation",
  {
    title: "Store Memory",
    description:
      "Store durable facts and preferences after drafting a response. Call after responding to persist user context across sessions.",
    inputSchema: {
      user_message: z.string().describe("The full user message"),
      assistant_response: z.string().describe("The full assistant response"),
      projectId: z.string().optional().describe("Optional project scope"),
      sessionId: z.string().optional().describe("Optional session scope"),
      summary: z.string().optional().describe("Optional turn summary"),
      trace: z
        .string()
        .optional()
        .describe("Optional agent execution trace data (JSON-encoded)"),
    },
  },
  async (args) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_advanced_augmentation",
        arguments: args,
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "memory being created" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error storing memory: ${message}`);
    }
  },
);

// memori_feedback — report memory quality issues
server.registerTool(
  "memori_feedback",
  {
    title: "Memory Feedback",
    description:
      "Report irrelevant, missing, stale, or especially useful memory behavior. Use when the user flags a memory quality problem or explicitly praises a recall result.",
    inputSchema: {
      feedback: z
        .string()
        .describe(
          "Description of the memory issue or praise (e.g. 'recalled fact was outdated', 'this recall was very helpful')",
        ),
      rating: z
        .enum(["positive", "negative"])
        .optional()
        .describe("Optional sentiment signal"),
    },
  },
  async (args) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_feedback",
        arguments: args,
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "Feedback received" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error submitting feedback: ${message}`);
    }
  },
);

// memori_signup — request an API key
server.registerTool(
  "memori_signup",
  {
    title: "Sign Up for Memori",
    description:
      "Request a Memori account and API key when the user explicitly asks and provides an email address.",
    inputSchema: {
      email: z
        .string()
        .describe("The user's email address for account creation"),
    },
  },
  async (args) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_signup",
        arguments: args,
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "Signup request submitted" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error submitting signup: ${message}`);
    }
  },
);

// memori_quota — check memory usage and limits
server.registerTool(
  "memori_quota",
  {
    title: "Check Memory Quota",
    description:
      "Check current memory usage and limits. Use when the user asks about usage or quota errors appear.",
    inputSchema: {},
  },
  async () => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "memori_quota",
        arguments: {},
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "Quota information unavailable" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return makeErrorContent(`Error fetching quota: ${message}`);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Memori MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
