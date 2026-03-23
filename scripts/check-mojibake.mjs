#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const rootDir = process.cwd();
const includeExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.css', '.scss', '.html', '.yml', '.yaml']);
const ignoreDirs = new Set(['.git', '.next', 'node_modules', 'dist', 'build', 'coverage']);
const ignoredFiles = new Set(['docs/encoding-utf8-front.md']);

const suspiciousPatterns = [
  { pattern: /Posi\?\?o/g, label: 'Posicao corrompida' },
  { pattern: /Distribu\?do/g, label: 'Distribuido corrompido' },
  { pattern: /Bot\?o/g, label: 'Botao corrompido' },
  { pattern: /v\?lida/g, label: 'valida corrompido' },
  { pattern: /N\?o/g, label: 'Nao corrompido' },
  { pattern: /Fun\?\?/g, label: 'Funcoes corrompido' },
  { pattern: /\uFFFD/g, label: 'Replacement character' },
  { pattern: /\u00C3[a-zA-Z\u00C0-\u017F]?/g, label: 'Possivel mojibake com A til' },
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const rel = relative(rootDir, fullPath).replaceAll('\\', '/');
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (!ignoreDirs.has(name)) {
        walk(fullPath, files);
      }
      continue;
    }
    if (includeExt.has(extname(name)) && !ignoredFiles.has(rel)) {
      files.push({ fullPath, rel });
    }
  }
  return files;
}

const findings = [];
for (const file of walk(rootDir)) {
  const content = readFileSync(file.fullPath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const entry of suspiciousPatterns) {
      if (entry.pattern.test(line)) {
        findings.push(`${file.rel}:${index + 1} - ${entry.label} - ${line.trim()}`);
      }
      entry.pattern.lastIndex = 0;
    }
  });
}

if (findings.length > 0) {
  console.error('Encoding/mojibake check failed.');
  findings.forEach((item) => console.error(item));
  process.exit(1);
}

console.log('Encoding/mojibake check passed.');
