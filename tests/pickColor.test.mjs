import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/popup/pickColor.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ colors = [], failure, unsupported = false, storageFailure = false } = {}) {
  let opened = false;
  let saved;
  const context = vm.createContext({
    exports: {}, DOMException,
    window: unsupported ? {} : {
      EyeDropper: class {
        open() {
          opened = true;
          return failure ? Promise.reject(failure) : Promise.resolve({ sRGBHex: '#aabbcc' });
        }
      },
    },
    chrome: { storage: { local: {
      get: async () => ({ colors }),
      set: async value => {
        if (storageFailure) throw new Error('Storage unavailable');
        saved = JSON.parse(JSON.stringify(value));
      },
    } } },
  });
  vm.runInContext(code, context);
  return { pick: context.exports.pickColor, opened: () => opened, saved: () => saved };
}

test('opens synchronously and saves normalized pixel color without duplicates', async () => {
  const picker = setup({ colors: ['#123456', '#AABBCC'] });
  const result = picker.pick();
  assert.equal(picker.opened(), true);
  assert.equal(await result, '#AABBCC');
  assert.deepEqual(picker.saved(), { colors: ['#AABBCC', '#123456'] });
});

test('keeps at most 50 colors', async () => {
  const picker = setup({ colors: Array.from({ length: 50 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`) });
  await picker.pick();
  assert.equal(picker.saved().colors.length, 50);
  assert.equal(picker.saved().colors[0], '#AABBCC');
});

test('Escape cancels without replacing saved color', async () => {
  const picker = setup({ failure: new DOMException('Cancelled', 'AbortError') });
  assert.equal(await picker.pick(), null);
  assert.equal(picker.saved(), undefined);
});

test('unsupported browsers receive an actionable error', async () => {
  const picker = setup({ unsupported: true });
  await assert.rejects(picker.pick(), /EyeDropper support/);
  assert.equal(picker.saved(), undefined);
});

test('picker failure is reported without overwriting saved color', async () => {
  const picker = setup({ failure: new DOMException('Unavailable', 'OperationError') });
  await assert.rejects(picker.pick(), /Unavailable/);
  assert.equal(picker.saved(), undefined);
});

test('storage failure is reported instead of claiming success', async () => {
  await assert.rejects(setup({ storageFailure: true }).pick(), /Storage unavailable/);
});
