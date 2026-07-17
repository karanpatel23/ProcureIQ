import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const required = ['AUTH_SECRET', 'CORVEN_DATA_PATH', 'QUOTE_STORAGE_PATH', 'MAX_UPLOAD_BYTES', 'ALLOWED_UPLOAD_MIME_TYPES'];
const envExample = readFileSync('.env.example', 'utf8');
const missing = required.filter((key) => !envExample.includes(`${key}=`));
if (missing.length) throw new Error(`.env.example is missing: ${missing.join(', ')}`);

const bannedTerms = [['S','M','B'].join(''), ['S','M','B','s'].join(''), ['small', 'business'].join(' ')];
const banned = new RegExp(`\\b(${bannedTerms.map((term) => term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (['.git', 'node_modules', '.next'].includes(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(tsx?|md|css|json|sql|mjs|example)$/.test(path)) {
      const content = readFileSync(path, 'utf8');
      if (banned.test(content)) throw new Error(`Banned copy found in ${path}`);
    }
  }
}
walk('.');
console.log('Smoke checklist passed: env example present and banned copy absent.');
