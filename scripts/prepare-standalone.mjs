import { cp, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

// Next.js standalone output omits public and .next/static by default.
await access(path.join(standalone, 'server.js'));
await cp(path.join(root, 'public'), path.join(standalone, 'public'), {
  recursive: true,
  // Audio is uploaded at runtime and must not become part of a release.
  filter: (source) => source !== path.join(root, 'public', 'audio'),
});
await cp(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
  recursive: true,
});
console.log('Prepared standalone public assets and Next.js static files.');
