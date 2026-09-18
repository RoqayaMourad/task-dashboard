#!/usr/bin/env node

/**
 * Composes mock-api/db.json for json-server.
 *
 * Runs the supplied, unmodified `generate-data.js` (which writes fresh
 * statistics.json/tasks.json with dates relative to "now" into its own
 * directory, exactly as DATA_README.md describes), then reads those two
 * files and reshapes them into a json-server-compatible db.json:
 *   - unwraps `{ tasks, meta }` / `{ statistics, lastUpdated }` into bare
 *     arrays (json-server's REST/CRUD conventions require a bare array per
 *     top-level collection key; the wrapper metadata is dropped as it isn't
 *     needed server-side)
 *   - derives a `users` collection by de-duplicating the `assignee` objects
 *     already embedded in every task (no separate users source exists in
 *     the supplied data)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GENERATOR_PATH = path.join(
  __dirname,
  '..',
  '..',
  'senior-frontend-test',
  'data-fetching',
  'generate-data.js',
);

function runGenerator() {
  if (!fs.existsSync(GENERATOR_PATH)) {
    throw new Error(`Supplied data generator not found at ${GENERATOR_PATH}`);
  }
  const result = spawnSync(process.execPath, [GENERATOR_PATH], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`generate-data.js exited with status ${result.status}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function deriveUsers(tasks) {
  const seen = new Map();
  for (const task of tasks) {
    if (!seen.has(task.assignee.id)) {
      seen.set(task.assignee.id, task.assignee);
    }
  }
  return Array.from(seen.values());
}

function main() {
  runGenerator();

  const generatorDir = path.dirname(GENERATOR_PATH);
  const tasksData = readJson(path.join(generatorDir, 'tasks.json'));
  const statisticsData = readJson(path.join(generatorDir, 'statistics.json'));

  const tasks = tasksData.tasks;
  const statistics = statisticsData.statistics;
  const users = deriveUsers(tasks);

  const db = { tasks, statistics, users };
  const outPath = path.join(__dirname, 'db.json');
  fs.writeFileSync(outPath, JSON.stringify(db, null, 2) + '\n', 'utf8');

  console.log(
    `\n✅ Composed ${outPath} — ${tasks.length} tasks, ${statistics.length} statistics, ${users.length} users.`,
  );
}

main();
