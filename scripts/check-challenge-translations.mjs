import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'challenges/catalog.json'), 'utf8'));
const errors = [];
const blocks = (text) => [...text.matchAll(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm)].map(m => m[0]);
const prose = (text) => blocks(text).reduce((s, b) => s.replace(b, ''), text);
const tokens = (text) => {
  const body = prose(text);
  const runs = [...body.matchAll(/`+/g)];
  const values = [];
  for (let i = 0; i < runs.length; i++) {
    const close = runs.findIndex((run, j) => j > i && run[0].length === runs[i][0].length);
    if (close < 0) continue;
    values.push(body.slice(runs[i].index + runs[i][0].length, runs[close].index));
    i = close;
  }
  return values.sort();
};
const urls = (text) => [...text.matchAll(/https?:\/\/[^\s<>"\])]+/g)].map(m => m[0]).sort();
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
let count = 0;
for (const c of catalog.challenges) {
  const localePath = path.join(root, 'challenges/locales/ru', `${c.slug}.json`);
  if (!fs.existsSync(localePath)) { errors.push(`${c.slug}: missing locale`); continue; }
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  for (const e of c.extensions || []) if (!locale.extensions?.[e.slug]) errors.push(`${c.slug}/${e.slug}: missing extension name`);
  for (const s of c.stages) {
    const id = `${c.slug}/${s.slug}`;
    if (!locale.stages?.[s.slug] || !/[А-Яа-яЁё]/.test(locale.stages[s.slug])) errors.push(`${id}: missing Russian stage name`);
    const dest = path.join(root, 'challenges', s.descriptionPath.replace(/^content\//, 'content-ru/'));
    if (!fs.existsSync(dest)) { errors.push(`${id}: missing translation`); continue; }
    const en = fs.readFileSync(path.join(root,'challenges',s.descriptionPath),'utf8');
    const ru = fs.readFileSync(dest,'utf8');
    if (!/[А-Яа-яЁё]/.test(prose(ru))) errors.push(`${id}: no Russian prose`);
    if (!same(blocks(en).map(b => b.trimEnd()),blocks(ru).map(b => b.trimEnd()))) errors.push(`${id}: code blocks differ`);
    if (!same(tokens(en),tokens(ru))) errors.push(`${id}: inline code differs`);
    if (!same(urls(en),urls(ru))) errors.push(`${id}: external URLs differ`);
    count++;
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Verified ${count} Russian stages: names, code blocks, inline code and external URLs preserved.`);
