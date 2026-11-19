/**
 * Convenience harness: starts an in-memory MongoDB, seeds it, then runs the API.
 * Useful for demos on machines without a local MongoDB installation.
 * Run: npm run dev:memory
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';

const memory = await MongoMemoryServer.create();
const uri = memory.getUri('smart_library_demo');

const seed = spawn(process.execPath, ['seed/seed.js'], {
  cwd: process.cwd(),
  env: { ...process.env, MONGO_URI: uri },
  stdio: 'inherit',
});
await new Promise((resolve) => seed.on('exit', resolve));

const api = spawn(process.execPath, ['server.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    MONGO_URI: uri,
    PORT: process.env.PORT || '5000',
    JWT_SECRET: process.env.JWT_SECRET || 'demo-secret-change-me',
    NODE_ENV: 'development',
  },
  stdio: 'inherit',
});

const shutdown = () => {
  api.kill('SIGTERM');
  memory.stop().finally(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

api.on('exit', async (code) => {
  await memory.stop();
  process.exit(code || 0);
});
