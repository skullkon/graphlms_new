#!/usr/bin/env node
import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cache = path.join(os.homedir(), '.cache', 'graphlms-project-lab');
const metadata = '.graphlms.json';
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (!['list', 'init', 'test', 'submit', 'status'].includes(command)) throw Error('Usage: project-lab list | init <challenge> <new-directory> [--language go] | test|submit [--stage slug] [--json] | status');
  const options = {}, positional = [];
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i];
    if (key === '--json') options.json = true;
    else if (key === '--allow-paid-api') options.allowPaidApi = true;
    else if (['--language', '--stage', '--url'].includes(key)) {
      if (!rest[i + 1] || rest[i + 1].startsWith('--')) throw Error(`Missing value for ${key}`);
      options[key.slice(2)] = rest[++i];
    } else if (key.startsWith('-')) throw Error(`Unknown option ${key}`);
    else positional.push(key);
  }
  if (positional.length !== (command === 'init' ? 2 : 0)) throw Error('Unexpected or missing positional arguments');
  if (options.allowPaidApi && !['test','submit'].includes(command)) throw Error('--allow-paid-api applies only to test/submit');
  if (options.language && command !== 'init' || options.stage && !['test','submit'].includes(command) || options.url && command !== 'submit') throw Error('Option does not apply to this command');
  return { command, options, positional };
}
export function localUrl(value = 'http://127.0.0.1:3000') {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Submission URL must be a loopback HTTP origin');
  return new URL('/api/project-lab/runs', url).href;
}
export function run(command, args, { cwd, env = process.env, timeout = 180000, limit = 65536 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', timedOut = false, truncated = false;
    const kill = () => { try { process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGKILL'); } catch {} };
    const timer = setTimeout(() => { timedOut = true; kill(); }, timeout);
    const collect = chunk => { const value = chunk.toString(); if (output.length + value.length > limit) truncated = true; if (output.length < limit) output += value.slice(0, limit - output.length); };
    child.stdout.on('data', collect); child.stderr.on('data', collect);
    child.on('error', error => { clearTimeout(timer); reject(Error(`Cannot run ${command}: ${error.message}. Install the required runtime and ensure it is on PATH.`)); });
    child.on('close', (code, signal) => { clearTimeout(timer); kill(); resolve({ code, signal, output, timedOut, truncated }); });
  });
}
async function checked(command, args, options) {
  const result = await run(command, args, options);
  if (result.code !== 0 || result.timedOut) throw Error(`${command} failed${result.timedOut ? ' (timeout)' : ''}: ${result.output}`);
  return result;
}
export async function safeTree(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw Error(`Refusing symbolic link in starter: ${entry.name}`);
    if (entry.isDirectory()) await safeTree(path.join(directory, entry.name));
    else if (!entry.isFile()) throw Error(`Unsupported starter entry: ${entry.name}`);
  }
}
export async function checkout(url, commit, kind) {
  if (!/^https:\/\/github\.com\/codecrafters-io\/[a-z0-9-]+(?:\.git)?$/.test(url) || !/^[a-f0-9]{40}$/.test(commit)) throw Error(`Invalid pinned ${kind} source in catalogue`);
  await fs.mkdir(cache, { recursive: true });
  const target = path.join(cache, `${kind}-${commit}`);
  try { if ((await fs.lstat(target)).isSymbolicLink()) throw Error('Cache path must not be a symlink'); if ((await checked('git', ['rev-parse','HEAD'], { cwd: target })).output.trim() === commit) return target; throw Error('Cached checkout has wrong revision'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const temp = await fs.mkdtemp(path.join(cache, 'fetch-'));
  try {
    await checked('git', ['init', temp]);
    await checked('git', ['-C', temp, 'fetch', '--depth=1', url, commit], { timeout: 300000 });
    await checked('git', ['-C', temp, 'checkout', '--detach', 'FETCH_HEAD']);
    await fs.rename(temp, target);
  } catch (error) { await fs.rm(temp, { recursive: true, force: true }); throw error; }
  return target;
}
export function selectedStages(challenge, slug) {
  const index = challenge.stages.findIndex(s => s.slug === slug);
  if (index < 0) throw Error(`Unknown stage ${slug}`);
  const target = challenge.stages[index];
  const selected = new Set(challenge.stages.slice(0, index + 1).filter(s => s.group === 'base' || s.group === target.group).map(s => s.slug));
  const add = slug => { const item = challenge.stages.find(s => s.slug === slug); if (!item) throw Error(`Unknown prerequisite ${slug}`); if (!selected.has(slug)) { selected.add(slug); for (const dep of item.prerequisites || []) add(dep); } };
  for (const item of challenge.stages.filter(s => selected.has(s.slug))) for (const dep of item.prerequisites || []) add(dep);
  return challenge.stages.filter(s => selected.has(s.slug) && s.testerStage);
}
export async function initialize(challenge, destination, language) {
  if (!challenge.languages.includes(language)) throw Error(`Unsupported language ${language}; available: ${challenge.languages.join(', ')}`);
  const target = path.resolve(destination);
  try { await fs.lstat(target); throw Error('Destination already exists; choose a new directory. No files were changed.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const course = await checkout(challenge.upstreamUrl.replace(/\/$/, ''), challenge.sourceCommit, 'course');
  const starter = path.join(course, 'compiled_starters', language);
  await safeTree(starter);
  // Exclusive mkdir prevents accidentally merging or overwriting another directory.
  await fs.mkdir(target);
  for (const entry of await fs.readdir(starter)) await fs.cp(path.join(starter, entry), path.join(target, entry), { recursive: true, errorOnExist: true, force: false });
  let starterAdjustment;
  if (language === 'go') {
    const installed = (await checked('go', ['env', 'GOVERSION'], { cwd: os.tmpdir() })).output.trim().replace(/^go/, '');
    const manifestPath = path.join(target, 'go.mod');
    const manifest = await fs.readFile(manifestPath, 'utf8');
    const originalVersion = manifest.match(/^go\s+([\d.]+)/m)?.[1];
    const newer = (a,b) => { const aa=a.split('.').map(Number),bb=b.split('.').map(Number); for(let i=0;i<3;i++){ if((aa[i]||0)!==(bb[i]||0)) return (aa[i]||0)>(bb[i]||0); } return false; };
    if (originalVersion && /^\d+\.\d+(\.\d+)?$/.test(installed) && newer(originalVersion, installed)) {
      await fs.writeFile(manifestPath, manifest.replace(/^go\s+[\d.]+/m, `go ${installed}`).replace(/^toolchain\s+go[\d.]+\s*$/mg, ''));
      starterAdjustment = `New Go starter manifest adapted from ${originalVersion} to installed ${installed}`;
    }
  }
  await fs.writeFile(path.join(target, metadata), JSON.stringify({ version: 1, challenge: challenge.slug, language, stage: challenge.stages.find(s => s.testerStage)?.slug, sourceCommit: challenge.sourceCommit, starterAdjustment }, null, 2), { flag: 'wx' });
  await checked('git', ['init', target]);
  return { directory: target, challenge: challenge.slug, language, notice: starterAdjustment };
}
async function sourceHash(directory) {
  const hash = createHash('sha256');
  // Hash tracked and untracked nonignored solution files, excluding local state.
  const listing = await checked('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: directory, limit: 4 * 1024 * 1024 });
  if (listing.truncated) throw Error('Solution file listing exceeds 4MiB; cannot compute an accurate source hash');
  const files = listing.output.split('\0').filter(Boolean);
  for (const file of [...new Set(files)].sort()) {
    if (file === metadata) continue;
    const absolute = path.join(directory, file), stat = await fs.lstat(absolute);
    if (!stat.isFile()) continue;
    hash.update(file); hash.update('\0'); hash.update(await fs.readFile(absolute));
  }
  return hash.digest('hex');
}
export function boundedOutput(value, truncated = false) {
  const clean = value.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');
  let length = clean.length;
  // Bound the serialized JSON size as well as raw UTF-8 (control characters expand).
  while (Buffer.byteLength(JSON.stringify(clean.slice(0, length)), 'utf8') > 32000) length = Math.floor(length * 0.9);
  return length < clean.length || truncated ? clean.slice(0, length) + '\n[Output truncated]' : clean;
}
export function checkPaidApi(challenge, options, env = process.env) {
  if (challenge.slug !== 'claude-code') return;
  if (!options.allowPaidApi) throw Error('Claude Code official checks call the paid OpenRouter API. Explicitly opt in with --allow-paid-api and provide CODECRAFTERS_SECRET_OPENROUTER_API_KEY to run them. Reading and scaffolding are free.');
  if (!env.CODECRAFTERS_SECRET_OPENROUTER_API_KEY) throw Error('Paid API opt-in requires CODECRAFTERS_SECRET_OPENROUTER_API_KEY in your environment. No request was sent.');
}
export async function acquireRunLock(slug, directory = '/tmp') {
  if (!/^[a-z0-9-]+$/.test(slug)) throw Error('Invalid run lock identifier');
  const lock = path.join(directory, `graphlms-project-lab-${slug}.lock`);
  try { await fs.mkdir(lock, { mode: 0o700 }); } catch (error) {
    if (error.code === 'EEXIST') throw Error(`Another ${slug} run owns ${lock}. Wait for it to finish. If interrupted, verify no tester remains before removing this stale lock.`);
    throw error;
  }
  const owner = `${process.pid}:${randomUUID()}`;
  try { await fs.writeFile(path.join(lock, 'owner'), owner, { flag: 'wx', mode: 0o600 }); } catch (error) { await fs.rmdir(lock).catch(() => {}); throw error; }
  return async () => {
    if (await fs.readFile(path.join(lock, 'owner'), 'utf8').catch(() => null) !== owner) return;
    await fs.unlink(path.join(lock, 'owner'));
    await fs.rmdir(lock);
  };
}
export async function goCacheEnvironment() {
  const result = await checked('go', ['env', '-json', 'GOPATH', 'GOMODCACHE', 'GOCACHE', 'GOROOT'], { cwd: os.tmpdir() });
  return JSON.parse(result.output);
}
async function test(challenge, state, options) {
  checkPaidApi(challenge, options);
  const runtime = { go: 'go', javascript: 'node', typescript: 'bun', python: 'python3', rust: 'cargo', ruby: 'ruby', java: 'java', c: 'gcc', cpp: 'g++', csharp: 'dotnet', php: 'php', elixir: 'elixir', zig: 'zig', scala: 'scala', kotlin: 'kotlinc', dart: 'dart', gleam: 'gleam', haskell: 'ghc', ocaml: 'dune', odin: 'odin', clojure: 'clojure' }[state.language];
  if (runtime) {
    const found = await Promise.all((process.env.PATH || '').split(path.delimiter).map(dir => fs.access(path.join(dir, runtime), 1).then(() => true, () => false)));
    if (!found.some(Boolean)) throw Error(`Missing ${state.language} runtime: install ${runtime} and add it to PATH`);
  }
  const stage = options.stage || state.stage || challenge.stages.find(s => s.testerStage)?.slug;
  const stages = selectedStages(challenge, stage);
  if (!stages.length) throw Error('This stage has no executable tests');
  if (!challenge.testerCommit || !challenge.testerRepository) throw Error('No pinned official tester is available for this challenge');
  const source = await checkout(challenge.testerRepository, challenge.testerCommit, 'tester');
  const binary = path.join(source, `graphlms-tester-${process.platform}-${process.arch}`);
  try { await fs.access(binary); } catch { await checked('go', ['build', '-o', binary, './cmd/tester'], { cwd: source, timeout: 600000 }); }
  const start = Date.now();
  const scratch = await fs.mkdtemp('/tmp/graphlms-run-');
  const testerEnv = { ...process.env, TMPDIR: scratch };
  if (challenge.slug === 'claude-code') {
    // The upstream tester rewrites ~/.claude/settings.json: isolate its child environment.
    const isolatedHome = path.join(scratch, 'home'); await fs.mkdir(isolatedHome);
    testerEnv.HOME = isolatedHome;
    if (state.language === 'go') Object.assign(testerEnv, await goCacheEnvironment());
  }
  const protectedPaths = challenge.slug === 'kafka' ? ['/tmp/server.properties', '/tmp/kraft-combined-logs'] : challenge.slug === 'http-server' && stages.some(s => ['ap6','qv8'].includes(s.slug)) ? ['/tmp/data/codecrafters.io/http-server-tester'] : [];
  let result, releaseLock;
  try {
    if (protectedPaths.length) releaseLock = await acquireRunLock(challenge.slug);
    for (const item of protectedPaths) {
      try { await fs.lstat(item); throw Error(`Official tester needs exclusive temporary path ${item}, but it already exists. Preserve or move it before testing.`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      // Refuse symlinked parent paths, too.
      for (let parent = path.dirname(item); parent !== '/tmp' && parent !== '/'; parent = path.dirname(parent)) {
        try { if ((await fs.lstat(parent)).isSymbolicLink()) throw Error(`Tester temporary parent is a symlink: ${parent}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
    if (['grep', 'shell'].includes(challenge.slug)) {
      // Upstream relocates the first matching utility on PATH. Use an expendable copy.
      const utility = challenge.slug === 'grep' ? 'grep' : 'pwd';
      let original;
      for (const dir of (process.env.PATH || '').split(path.delimiter)) { const candidate = path.join(dir, utility); try { await fs.access(candidate, 1); original = candidate; break; } catch {} }
      if (!original) throw Error(`The official tester requires ${utility} on PATH`);
      const bin = path.join(scratch, 'bin'); await fs.mkdir(bin);
      await fs.copyFile(original, path.join(bin, utility)); await fs.chmod(path.join(bin, utility), 0o700);
      if (challenge.slug === 'shell') await fs.writeFile(path.join(bin, 'sudo'), '#!/bin/sh\nexec "$@"\n', { mode: 0o700 });
      testerEnv.PATH = `${bin}${path.delimiter}${process.env.PATH}`;
    }
    result = await run(binary, [], { cwd: scratch, env: { ...testerEnv, CODECRAFTERS_REPOSITORY_DIR: process.cwd(), CODECRAFTERS_SUBMISSION_DIR: process.cwd(), CODECRAFTERS_TEST_CASES_JSON: JSON.stringify(stages.map((s, i) => ({ slug: s.testerStage, title: s.name, tester_log_prefix: `stage-${i + 1}` }))) } });
    // These paths were absent before this run and belong to this tester invocation.
    for (const item of protectedPaths) await fs.rm(item, { recursive: true, force: true });
  } finally {
    try { await fs.rm(scratch, { recursive: true, force: true }); } finally { if (releaseLock) await releaseLock(); }
  }
  if (result.timedOut) throw Error(`Tester timed out after 180 seconds. All tester processes were stopped.\n${result.output}`);
  if (result.signal || /CodeCrafters internal error|panic:/.test(result.output)) throw Error(`Official tester failed to run: ${result.output}`);
  return { challenge: challenge.slug, stage, language: state.language, passed: result.code === 0, passedStages: result.code === 0 ? stages.map(s => s.slug) : [], output: boundedOutput(result.output, result.truncated), durationMs: Date.now() - start, submittedAt: new Date().toISOString(), sourceHash: await sourceHash(process.cwd()) };
}
export async function main(args = process.argv.slice(2)) {
  const { command, options, positional } = parseArgs(args);
  const catalog = JSON.parse(await fs.readFile(path.join(root, 'challenges/catalog.json'), 'utf8'));
  if (command === 'list') return options.json ? catalog : catalog.challenges.map(c => `${c.slug}\t${c.title}\t${c.stages.length} stages`).join('\n');
  if (command === 'init') {
    const challenge = catalog.challenges.find(c => c.slug === positional[0]);
    if (!challenge) throw Error(`Unknown challenge ${positional[0]}`);
    return initialize(challenge, positional[1], options.language || 'go');
  }
  const statePath = path.join(process.cwd(), metadata);
  if ((await fs.lstat(statePath).catch(() => { throw Error('Run this command inside a project created with project-lab init'); })).isSymbolicLink()) throw Error('Project metadata must not be a symlink');
  const state = JSON.parse(await fs.readFile(statePath, 'utf8').catch(() => { throw Error('Run this command inside a project created with project-lab init'); }));
  if (command === 'status') return state;
  const challenge = catalog.challenges.find(c => c.slug === state.challenge);
  if (!challenge) throw Error('Project challenge is not in the catalogue');
  const endpoint = command === 'submit' ? localUrl(options.url) : null;
  const report = await test(challenge, state, options);
  if (endpoint) {
    const token = (await fs.readFile(path.join(root, '.local/project-lab/token'), 'utf8').catch(() => { throw Error('Start the GraphLMS app and open Project Lab once to initialize the local submit token'); })).trim();
    const response = await fetch(endpoint, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(report), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error(`Local submission failed (${response.status}): ${await response.text()}`);
    report.saved = true;
  }
  state.stage = report.stage; state.lastRun = report;
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  if (!report.passed) process.exitCode = 1;
  return options.json ? report : `${report.output}\n${report.passed ? 'PASS' : 'FAIL'} · ${report.stage}${report.saved ? ' · saved to GraphLMS' : ''}`;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().then(result => console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2))).catch(error => { console.error(`Project Lab: ${error.message}`); process.exitCode = 2; });
