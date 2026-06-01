import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();

const SKIP_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'playwright-report',
  'test-results'
]);

const SCANNED_EXTENSIONS = new Set([
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.json',
  '.md',
  '.yml',
  '.yaml'
]);

/*
 * Build mojibake patterns from Unicode code points instead of embedding
 * corrupted strings directly. This allows this validation script to scan
 * itself without reporting its own pattern definitions as defects.
 */
const BROKEN_PATTERNS = [
  {
    label: 'misdecoded em dash',
    value: String.fromCodePoint(0x00e2, 0x20ac, 0x201d)
  },
  {
    label: 'misdecoded apostrophe',
    value: String.fromCodePoint(0x00e2, 0x20ac, 0x2122)
  },
  {
    label: 'misdecoded opening quote',
    value: String.fromCodePoint(0x00e2, 0x20ac, 0x0153)
  },
  {
    label: 'misdecoded bullet',
    value: String.fromCodePoint(0x00e2, 0x20ac, 0x00a2)
  },
  {
    label: 'misdecoded multiplication sign',
    value: String.fromCodePoint(0x00c3, 0x00d7)
  },
  {
    label: 'misdecoded UTF-8 BOM text',
    value: String.fromCodePoint(0x00ef, 0x00bb, 0x00bf)
  },
  {
    label: 'misdecoded non-breaking-space prefix',
    value: String.fromCodePoint(0x00c2)
  }
];

const findings = [];

async function scanDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRECTORIES.has(entry.name)) {
        await scanDirectory(filePath);
      }
      continue;
    }

    if (!SCANNED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      continue;
    }

    const content = await readFile(filePath, 'utf8');
    const displayPath = relative(ROOT, filePath);

    if (content.charCodeAt(0) === 0xfeff) {
      findings.push(`${displayPath}: UTF-8 byte order mark detected`);
    }

    for (const pattern of BROKEN_PATTERNS) {
      if (content.includes(pattern.value)) {
        findings.push(`${displayPath}: ${pattern.label}`);
      }
    }
  }
}

await scanDirectory(ROOT);

if (findings.length > 0) {
  throw new Error(`Encoding defects found:\n${findings.join('\n')}`);
}

console.log('Encoding validation passed.');