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

  remoteClient = new Client({ name: "memori-bridge", version: "1.0.0" });
  await remoteClient.connect(transport);
  return remoteClient;
}

// Create local stdio server
const server = new McpServer({
  name: "memori",
  version: "1.0.0",
});

// recall — fetch relevant memories at the start of a turn
server.registerTool(
  "recall",
  {
    title: "Recall Memories",
    description:
      "Retrieve relevant memories for a given query. Call at the start of user turns to fetch prior context, preferences, and facts.",
    inputSchema: {
      query: z
        .string()
        .describe("The user message or search query to recall memories for"),
    },
  },
  async ({ query }) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "recall",
        arguments: { query },
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "No memories found" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text" as const, text: `Error recalling memories: ${message}` },
        ],
        isError: true,
      };
    }
  },
);

// advanced_augmentation — store durable memory after responding
server.registerTool(
  "advanced_augmentation",
  {
    title: "Store Memory",
    description:
      "Store durable facts and preferences after drafting a response. Call after responding to persist user context across sessions.",
    inputSchema: {
      user_message: z.string().describe("The full user message"),
      assistant_response: z.string().describe("The full assistant response"),
    },
  },
  async ({ user_message, assistant_response }) => {
    try {
      const client = await getRemoteClient();
      const result = await client.callTool({
        name: "advanced_augmentation",
        arguments: { user_message, assistant_response },
      });
      return {
        content: (result.content as Array<{ type: "text"; text: string }>) || [
          { type: "text", text: "memory being created" },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error storing memory: ${message}`,
          },
        ],
        isError: true,
      };
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
