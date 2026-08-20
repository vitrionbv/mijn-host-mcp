#!/usr/bin/env node

import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./create-server.js";

void serveStdio(createServer);
console.error("mijn-host-mcp running on stdio");
