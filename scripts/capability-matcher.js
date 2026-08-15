#!/usr/bin/env node
/**
 * capability-matcher.js — 需求 → 能力包匹配引擎（公共能力市场核心工具）
 *
 * 用法：
 *   node capability-matcher.js "我想训练一个中医问诊智能体，要能辨证开方推荐穴位"
 *   node capability-matcher.js --json "训练一个八字排盘加合婚分析的助手"
 *   cat req.txt | node capability-matcher.js
 *
 * 输出：匹配能力包清单（覆盖度排序）+ 缺口分析 + 推荐计费模式 + 边界摘要
 * 数据源：../capability-registry.json（单一数据源，避免重复维护）
 */
'use strict';

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'capability-registry.json');

/* ---------- 工具函数 ---------- */

function fail(msg, code = 1) {
  console.error(`[ERROR] ${msg}`);
  process.exit(code);
}

function loadRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) fail(`注册表不存在: ${REGISTRY_PATH}`);
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.packs) || data.packs.length === 0) fail('注册表为空或无 packs 数组');
    return data;
  } catch (e) {
    fail(`读取注册表失败: ${e.message}`);
  }
  return null;
}

/** 输入校验：判空/去空格/长度限制 */
function normalizeInput(text) {
  if (typeof text !== 'string') fail('输入必须是文本');
  const t = text.trim();
  if (t.length === 0) fail('需求描述为空，请输入训练方向描述');
  if (t.length > 2000) fail('需求描述超过 2000 字上限，请精简');
  return t;
}

/** 覆盖度打分：命中关键词权重累计 / 包关键词总权重 */
function scorePack(pack, text) {
  const kws = Array.isArray(pack.keywords) ? pack.keywords : [];
  let hitWeight = 0;
  let totalWeight = 0;
  const hits = [];
  const missed = [];

  for (const kw of kws) {
    const weight = kw.length >= 4 ? 2 : 1; // 长词（专业术语）权重更高
    totalWeight += weight;
    if (text.includes(kw)) {
      hitWeight += weight;
      hits.push(kw);
    } else {
      missed.push(kw);
    }
  }

  const coverage = totalWeight === 0 ? 0 : Math.round((hitWeight / totalWeight) * 100);
  return { coverage, hits, missed, hitCount: hits.length, totalCount: kws.length };
}

/** 推荐计费模式：按命中的层组合 */
function recommendBilling(pack, coverage) {
  const layers = pack.layers || {};
  const active = [];
  if (layers.L1_data) active.push('L1');
  if (layers.L2_skill) active.push('L2');
  if (layers.L3_api) active.push('L3');

  if (active.includes('L1') && active.includes('L3')) return '词元制：API 按量（输入 ¥2/输出 ¥8 每百万）+ 数据买断（¥20/百万词元）';
  if (active.includes('L1')) return '数据资产买断（¥20/百万词元，一次性）';
  if (active.includes('L3')) return '词元制按量（输入 ¥2 / 输出 ¥8 每百万词元）';
  return '订阅制（¥3,900/年 含 2,000 万词元配额）';
}

/* ---------- 主流程 ---------- */

/** 核心评估函数：输入需求文本，返回 { report, results }（供 CLI 与 server 共用） */
function assess(query) {
  const registry = loadRegistry();
  const results = registry.packs
    .map(pack => {
      const s = scorePack(pack, query);
      return {
        packId: pack.id,
        packName: pack.name,
        domain: pack.domain,
        version: pack.version,
        maturity: pack.maturity || 0,
        coverage: s.coverage,
        hits: s.hits,
        missed: s.missed.slice(0, 8), // 缺口只列前 8，避免噪音
        recommendedBilling: recommendBilling(pack, s.coverage),
      };
    })
    .filter(r => r.coverage > 0)
    .sort((a, b) => b.coverage - a.coverage || b.maturity - a.maturity);

  const top = results.slice(0, 3);
  const gaps = top.flatMap(r => r.missed).filter((v, i, arr) => arr.indexOf(v) === i);

  const report = {
    schema: 'assessment/v1',
    generatedAt: new Date().toISOString(),
    query,
    matchCount: results.length,
    matches: results,
    topPicks: top.map(r => ({ packId: r.packId, relevance: r.coverage, billing: r.recommendedBilling })),
    gapAnalysis: {
      note: '以下关键词为高覆盖能力包中未命中的能力点，如需覆盖需定制开发或客户自建：',
      gaps: gaps.length ? gaps : ['无显著缺口'],
    },
    boundaryReminder: '签约前必须逐条确认各能力包 boundary 声明（capable/incapable/requires/compliance），见 templates/license-boundary-template.md',
  };
  return { report, results };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const textArgs = args.filter(a => !a.startsWith('--'));

  let input = textArgs.join(' ');
  if (!input && !process.stdin.isTTY) {
    // 支持管道输入
    try {
      const buf = fs.readFileSync(0, 'utf8');
      input = buf;
    } catch (e) {
      fail(`读取 stdin 失败: ${e.message}`);
    }
  }

  const query = normalizeInput(input);
  const { report, results } = assess(query);
  const gaps = report.gapAnalysis.gaps;

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('══════════════════════════════════════════════');
  console.log('  智能体公共能力包市场 · 需求评估引擎 v1.0');
  console.log('══════════════════════════════════════════════');
  console.log(`\n📝 需求描述：${query}\n`);

  if (results.length === 0) {
    console.log('⚠️  未匹配到任何能力包。建议：');
    console.log('  1. 补充领域关键词（如：八字/辨证/摄像头/交互/训练）');
    console.log('  2. 联系我方做人工需求解析（custom 定制包评估）');
    process.exit(0);
  }

  results.forEach((r, i) => {
    const stars = '★'.repeat(Math.min(r.maturity, 5)) + '☆'.repeat(5 - Math.min(r.maturity, 5));
    console.log(`┌─ ${i + 1}. ${r.packName} [${r.packId}] v${r.version} ${stars}`);
    console.log(`│   相关度：${r.coverage}%  |  命中领域点：${r.hits.join('、')}`);
    console.log(`│   推荐计费：${r.recommendedBilling}`);
    if (r.missed.length) console.log(`│   未覆盖点：${r.missed.join('、')}`);
    console.log('└──────────────────────────────────────────────');
  });

  console.log('\n📊 缺口分析（需定制/客户自建）：');
  if (gaps.length) gaps.forEach(g => console.log(`   • ${g}`));
  else console.log('   • 无显著缺口');

  console.log('\n🔒 边界提醒：签约前必须确认各包 boundary（capable/incapable/requires/compliance）');
  console.log('📄 完整评估报告模板：templates/requirement-assessment-template.md');
}

module.exports = { assess, scorePack, recommendBilling, normalizeInput, loadRegistry, fail };

if (require.main === module) {
  try {
    main();
  } catch (e) {
    fail(`运行异常: ${e.message}`);
  }
}
