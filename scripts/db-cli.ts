import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
// The running application never loads the migration account.
const migrationEnv = existsSync('.env.migrate') ? parseEnv(readFileSync('.env.migrate', 'utf8')) : {};
const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...process.argv.slice(2)], { env: { ...process.env, ...migrationEnv }, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
