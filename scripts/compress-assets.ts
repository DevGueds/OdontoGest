import { readdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { gzip, brotliCompress, constants } from 'node:zlib';
const gzipAsync = promisify(gzip), brotliAsync = promisify(brotliCompress);
async function compress(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await compress(file); continue; }
    if (!/\.(js|css|html|svg|json)$/.test(entry.name)) continue;
    const content = await readFile(file);
    await Promise.all([
      gzipAsync(content, { level: 9 }).then(data => writeFile(`${file}.gz`, data)),
      brotliAsync(content, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }).then(data => writeFile(`${file}.br`, data)),
    ]);
  }
}
await compress('dist/public');
console.log('Assets preparados com Brotli e gzip.');
