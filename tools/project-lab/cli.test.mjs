import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, localUrl, run, safeTree, initialize, selectedStages, boundedOutput, checkPaidApi, acquireRunLock, goCacheEnvironment } from './cli.mjs';
test('strict arguments and loopback submission origins', () => {
  for (const args of [['init','http-server'],['test','extra'],['test','--stage'],['test','--evil'],['status','--url','http://localhost']]) assert.throws(() => parseArgs(args));
  assert.equal(localUrl('http://127.0.0.1:3000'), 'http://127.0.0.1:3000/api/project-lab/runs');
  for (const url of ['https://localhost','http://example.com','http://localhost@evil.com','http://localhost/foo','file:///tmp/x']) assert.throws(() => localUrl(url));
});
test('initialization refuses traversal language, existing destination and symlink trees', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(),'lab-test-'));
  try {
    const challenge = { languages: ['go'] };
    await assert.rejects(initialize(challenge, dir, '../go'), /Unsupported language/);
    await assert.rejects(initialize(challenge, dir, 'go'), /already exists/);
    await fs.symlink('/tmp', path.join(dir,'link'));
    await assert.rejects(safeTree(dir), /symbolic link/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
test('exit status prevents false passes and output is bounded', async () => {
  const result = await run(process.execPath, ['-e', 'console.log("PASS".repeat(100)); process.exit(1)'], { limit: 20 });
  assert.equal(result.code, 1); assert.equal(result.output.length, 20);
});
test('timeouts terminate tester and child process group', async () => {
  const result = await run(process.execPath, ['-e', 'require("node:child_process").spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"inherit"});setInterval(()=>{},1000)'], { timeout: 100 });
  assert.equal(result.timedOut, true); assert.notEqual(result.code, 0);
});
test('extension checks include base and own preceding stages without unrelated extensions', () => {
  const stages = ['base','base','compression','compression','persistent','persistent'].map((group,i) => ({group,slug:String(i),testerStage:String(i)}));
  assert.deepEqual(selectedStages({stages},'4').map(s=>s.slug), ['0','1','4']);
  assert.throws(() => selectedStages({stages}, 'missing'));
});

test('report logs fit API byte budget and strip terminal escapes', () => {
  const output = boundedOutput('\x1b[31m' + '界'.repeat(30000));
  assert.ok(Buffer.byteLength(output, 'utf8') < 32768);
  assert.ok(output.endsWith('[Output truncated]'));
  assert.ok(!output.includes('\x1b'));
  assert.ok(Buffer.byteLength(JSON.stringify(boundedOutput('\0'.repeat(40000)))) < 32768);
});

test('Claude paid checks require explicit flag and credential before any execution', () => {
  const challenge = { slug: 'claude-code' };
  assert.throws(() => checkPaidApi(challenge, {}, { CODECRAFTERS_SECRET_OPENROUTER_API_KEY: 'test-only' }), /Explicitly opt in/);
  assert.throws(() => checkPaidApi(challenge, { allowPaidApi: true }, {}), /No request was sent/);
  assert.doesNotThrow(() => checkPaidApi(challenge, { allowPaidApi: true }, { CODECRAFTERS_SECRET_OPENROUTER_API_KEY: 'test-only' }));
  assert.throws(() => parseArgs(['list','--allow-paid-api']));
  assert.equal(parseArgs(['test','--allow-paid-api']).options.allowPaidApi, true);
});

test('fixed-path run lock excludes concurrent owners and releases only its own lock', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lab-lock-test-'));
  try {
    const release = await acquireRunLock('kafka', dir);
    await assert.rejects(acquireRunLock('kafka', dir), /Another kafka run owns/);
    await release();
    const releaseNext = await acquireRunLock('kafka', dir);
    await release(); // Previous owner cannot delete the new owner's lock.
    await assert.rejects(acquireRunLock('kafka', dir), /Another kafka run owns/);
    await releaseNext();
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
test('isolated Claude home preserves Go compiler and caches without API use', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lab-go-home-'));
  try {
    const retained = await goCacheEnvironment();
    for (const key of ['GOPATH','GOMODCACHE','GOCACHE','GOROOT']) assert.ok(path.isAbsolute(retained[key]));
    const result = await run('go', ['env', '-json', 'GOPATH','GOMODCACHE','GOCACHE','GOROOT'], { cwd: dir, env: { ...process.env, HOME: dir, ...retained } });
    assert.equal(result.code, 0);
    assert.deepEqual(JSON.parse(result.output), retained);
    await fs.writeFile(path.join(dir, 'main.go'), 'package main\nimport "fmt"\nfunc main(){fmt.Print("isolated-ok")}\n');
    const compiled = await run('go', ['run', path.join(dir, 'main.go')], { cwd: dir, env: { ...process.env, HOME: dir, ...retained } });
    assert.equal(compiled.code, 0); assert.equal(compiled.output, 'isolated-ok');
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
