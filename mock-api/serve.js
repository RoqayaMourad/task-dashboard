#!/usr/bin/env node

/**
 * Production/portable entry point for running json-server against
 * mock-api/db.json. Reads PORT/HOST in plain Node rather than shell syntax
 * (`$PORT` vs `%PORT%`) since npm's default script shell differs by OS
 * (cmd.exe on Windows, sh elsewhere) and this needs to work unmodified on
 * both a local machine and Render's Linux runtime, which injects PORT.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3000';
const host = process.env.HOST || '0.0.0.0';
const cliPath = require.resolve('json-server/lib/cli/bin.js');
const dbPath = path.join(__dirname, 'db.json');

const result = spawnSync(
  process.execPath,
  [cliPath, '--watch', dbPath, '--port', port, '--host', host],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 0);
