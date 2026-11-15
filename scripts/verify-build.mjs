import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
function builtFile(reference, base = dist) {
  const resolved = path.resolve(base, reference.replace(/^\//, ''));
  assert.ok(resolved.startsWith(dist + path.sep), `Asset outside dist: ${reference}`);
  assert.ok(fs.statSync(resolved).isFile(), `Missing built file: ${reference}`);
  return resolved;
}

const manifest = JSON.parse(fs.readFileSync(builtFile('manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
const popup = builtFile(manifest.action.default_popup);
for (const icon of Object.values({ ...manifest.icons, ...manifest.action.default_icon })) builtFile(icon);
function verifyHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) verifyHtml(file);
    else if (entry.name.endsWith('.html')) {
      for (const [, reference] of fs.readFileSync(file, 'utf8').matchAll(/(?:src|href)="([^"]+)"/g)) {
        builtFile(reference, reference.startsWith('/') ? dist : path.dirname(file));
      }
    }
  }
}
assert.ok(popup);
verifyHtml(dist);
console.log('Verified Manifest V3 popup, icons, and all built HTML entry assets.');
