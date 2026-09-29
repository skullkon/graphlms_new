#!/usr/bin/env node
/** Import pinned MIT course definitions. Run from repository root:
 * node scripts/import-challenges.mjs [--source-dir /tmp/lms-codecrafters-research]
 * Existing sources.json pins are reused. --refresh explicitly updates to checkout HEADs.
 * Rendered descriptions select Go language branches and omit reader_is_bot sections.
 * Only HTML comments beginning with a Tests/Notes Markdown heading are exposed.
 * Original Markdown and YAML remain under content/<slug>/upstream for provenance.
 * testerStage is the upstream stable stage slug; group is its extension slug or base.
 * extensions retains upstream metadata; no inferred stage dependencies are introduced.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require = createRequire(new URL('../site/web/package.json', import.meta.url));
const yaml = require('js-yaml');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const sourceDir = args.includes('--source-dir') ? args[args.indexOf('--source-dir')+1] : '/tmp/lms-codecrafters-research';
const refresh = args.includes('--refresh');
const old = fs.existsSync(path.join(root,'challenges/sources.json')) ? JSON.parse(fs.readFileSync(path.join(root,'challenges/sources.json'))) : {sources:[]};
const specs = [
 ['http-server','Собственный HTTP-сервер','TCP, HTTP-запросы, файлы, сжатие и постоянные соединения.'],
 ['redis','Собственный Redis','Команды Redis, структуры данных, хранение и репликация.'],
 ['shell','Собственный Shell','Командная оболочка: процессы, перенаправление, конвейеры и история.'],
 ['git','Собственный Git','Объекты Git, коммиты, деревья и клонирование репозитория.'],
 ['sqlite','Собственный SQLite','Чтение формата SQLite, SQL-запросы и индексы.'],
 ['dns-server','Собственный DNS-сервер','DNS-пакеты, записи, ответы и пересылка запросов.'],
 ['bittorrent','Собственный BitTorrent','Торрент-файлы, пиры, загрузка данных и magnet-ссылки.'],
 ['kafka','Собственная Kafka','Бинарный протокол Kafka, разделы, чтение и запись сообщений.'],
 ['grep','Собственный Grep','Регулярные выражения, поиск в файлах и группы захвата.'],
 ['interpreter','Собственный интерпретатор','От токенов и выражений до функций, классов и наследования.'],
 ['claude-code','Собственный Claude Code','Цикл ИИ-агента, инструменты и навыки для работы с кодом.'],
];
const git = (cwd,...a) => execFileSync('git',a,{cwd,encoding:'utf8'}).trim();
function unwrapTestNotes(input) {
 return input.replace(/<!--([\s\S]*?)-->/g, (comment, body) =>
  /^\s*#{1,6}\s+(?:Tests|Notes)\s*(?:\r?\n|$)/.test(body) ? body.trim() : comment);
}
function validateDescription(content, label) {
 // {{}} is intentional Lox source, not an unresolved Mustache variable.
 if (/{{\s*[^{}\s][^{}]*}}|<~[\s\S]*?~>/.test(content))
  throw new Error(`Unresolved template in ${label}`);
}
function render(input) {
 const stack = []; let output = ''; let cursor = 0;
 // The one delimiter switch escapes literal braces in the Lox example.
 input = input.replaceAll('{{=<~ ~>=}}','');
 const tokens = /{{([#^/]?[a-zA-Z_][a-zA-Z_0-9]*)}}/g;
 for (const match of input.matchAll(tokens)) {
  if(stack.every(x=>x.active)) output += input.slice(cursor,match.index);
  const token=match[1], marker=token[0], key=token.slice(1);
  if(marker==='#'||marker==='^') {
   if(!key.startsWith('lang_is_') && key!=='reader_is_bot') throw new Error(`Unknown template ${token}`);
   const value=key==='lang_is_go'; stack.push({key,active:marker==='#'?value:!value});
  } else if(marker==='/') { if(stack.pop()?.key!==key) throw new Error(`Unbalanced template ${token}`); }
  else if(stack.every(x=>x.active)) { if(token!=='language_name') throw new Error(`Unknown variable ${token}`); output+='Go'; }
  cursor=match.index+match[0].length;
 }
 if(stack.length) throw new Error('Unclosed template');
 return output+input.slice(cursor);
}
// Guard transformations against exposing unrelated upstream comments or losing code.
if (unwrapTestNotes('<!--\n### Tests\nRun it.\n-->') !== '### Tests\nRun it.' ||
    unwrapTestNotes('<!-- ### Notes\nRead it. -->') !== '### Notes\nRead it.' ||
    unwrapTestNotes('<!-- private note -->') !== '<!-- private note -->' ||
    unwrapTestNotes('<!-- ### Testing plan\nHidden. -->') !== '<!-- ### Testing plan\nHidden. -->' ||
    render('{{#lang_is_go}}Go{{/lang_is_go}}{{^lang_is_go}}Other{{/lang_is_go}}') !== 'Go' ||
    render('```{{=<~ ~>=}}\n{{}}\n```') !== '```\n{{}}\n```') throw new Error('Importer transformation check failed');
let rejectsUnresolved = false;
try { validateDescription('{{unknown}}', 'self-check'); } catch { rejectsUnresolved = true; }
if (!rejectsUnresolved) throw new Error('Template validation check failed');
const catalog={version:1,challenges:[]}, sources=[];
for (const [slug,title,description] of specs) {
 const upstreamUrl=`https://github.com/codecrafters-io/build-your-own-${slug}`;
 const dir=path.resolve(sourceDir,`${slug}-course`);
 const previous=old.sources.find(s=>s.slug===slug);
 if(!fs.existsSync(dir)) {fs.mkdirSync(sourceDir,{recursive:true});execFileSync('git',['clone',upstreamUrl,dir],{stdio:'inherit'});}
 const commit=previous&&!refresh ? previous.sourceCommit : git(dir,'rev-parse','HEAD');
 const read=(file)=>execFileSync('git',['show',`${commit}:${file}`],{cwd:dir,encoding:'utf8',maxBuffer:16*1024*1024});
 const definition=read('course-definition.yml'), data=yaml.load(definition);
 const license=read('LICENSE'); if(!license.includes('MIT License'))throw new Error(`Non-MIT source: ${slug}`);
 const testerRepository=`https://github.com/codecrafters-io/${slug}-tester.git`;
 const testerCommit=previous&&!refresh ? previous.testerCommit : git(root,'ls-remote',testerRepository,'HEAD').split(/\s+/)[0];
 if(!/^[a-f0-9]{40}$/.test(testerCommit))throw new Error(`Missing tester commit ${slug}`);
 const out=path.join(root,'challenges/content',slug);fs.mkdirSync(path.join(out,'upstream'),{recursive:true});
 fs.writeFileSync(path.join(out,'upstream/course-definition.yml'),definition);
 fs.writeFileSync(path.join(root,'challenges/licenses',`${slug}.LICENSE`),license);
 const names=git(dir,'ls-tree','-r','--name-only',commit,'stage_descriptions').split('\n');
 const seen=new Set();
 const stages=data.stages.map(s=>{
  if(!s.slug||seen.has(s.slug))throw new Error(`Duplicate/missing stage ${slug}/${s.slug}`);seen.add(s.slug);
  const files=names.filter(n=>n.endsWith(`-${s.slug}.md`)||n===`stage_descriptions/${s.slug}.md`);
  if(files.length!==1)throw new Error(`Expected one description for ${slug}/${s.slug}, found ${files.length}`);
  const original=read(files[0]);fs.writeFileSync(path.join(out,'upstream',`${s.slug}.md`),original);
  let content=unwrapTestNotes(render(original));
  validateDescription(content,`${slug}/${s.slug}`);
  const assetBase=`https://raw.githubusercontent.com/codecrafters-io/build-your-own-${slug}/${commit}/stage_descriptions/`;
  const absolute=u=>/^(?:[a-z]+:|#|\/\/)/i.test(u)?u:new URL(u,assetBase).href;
  content=content.replace(/(!?\[[^\]]*\]\()([^\s)]+)(\))/g,(_,a,u,b)=>a+absolute(u)+b);
  content=content.replace(/^(\[[^\]]+\]:\s*)(\S+)/gm,(_,a,u)=>a+absolute(u));
  fs.writeFileSync(path.join(out,`${s.slug}.md`),content);
  return {slug:s.slug,name:s.name,group:s.primary_extension_slug||'base',descriptionPath:`content/${slug}/${s.slug}.md`,testerStage:s.slug,...(s.difficulty?{difficulty:s.difficulty}:{})};
 });
 const challenge={slug,title,shortName:data.short_name,description,upstreamUrl,sourceCommit:commit,testerRepository,testerCommit,languages:data.languages.map(l=>l.slug),stages,extensions:data.extensions||[],descriptionLanguage:'en',templateLanguage:'go',licensePath:`licenses/${slug}.LICENSE`};
 catalog.challenges.push(challenge);
 sources.push({slug,upstreamUrl,sourceCommit:commit,testerRepository,testerCommit,license:'MIT',stageCount:stages.length});
 console.log(`${slug}: ${stages.length} stages`);
}
for(const c of catalog.challenges)for(const s of c.stages)if(!fs.statSync(path.join(root,'challenges',s.descriptionPath)).isFile())throw new Error('Missing generated description');
fs.writeFileSync(path.join(root,'challenges/catalog.json'),JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync(path.join(root,'challenges/sources.json'),JSON.stringify({version:1,description:'Public MIT course definitions, pinned by Git commit. Stage order follows course-definition.yml. Rendered Markdown selects Go; originals are preserved. Tester sources are pinned separately and not vendored.',sources},null,2)+'\n');
console.log(`Imported ${catalog.challenges.length} courses, ${catalog.challenges.reduce((n,c)=>n+c.stages.length,0)} stages.`);
