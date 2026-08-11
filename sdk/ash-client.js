/**
 * ash-client.js — ASH (Agent Standards Hub) JavaScript/Node 客户端 SDK
 *
 * 安装：直接 require 或 <script> 引入
 * 用法：
 *   const ASH = require('./ash-client.js');
 *   const client = new ASH('http://localhost:8933', 'ash_your_key');
 *   const card = await client.analyze('训练一个医疗问诊智能体');
 *
 * License: MIT
 */
'use strict';

const http = require('http');
const https = require('https');

class ASHClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = (baseUrl || 'http://localhost:8933').replace(/\/$/, '');
    this.apiKey = apiKey || '';
    this._fetch = baseUrl && baseUrl.startsWith('https') ? https : http;
  }

  _request(method, path, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const opts = {
        method,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      };
      if (this.apiKey) opts.headers['X-API-Key'] = this.apiKey;
      if (body) opts.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));

      const req = this._fetch.request(opts, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch (e) { resolve({ status: res.statusCode, data: { raw: data } }); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('请求超时（30s）')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  /* ===== 公共接口 ===== */

  /** 注册客户 → 返回 apiKey */
  async register(name, contact) {
    const r = await this._request('POST', '/api/auth/register', { name, contact });
    if (r.data.ok) this.apiKey = r.data.apiKey;
    return r.data;
  }

  /** 需求评估 → 需求卡 */
  async analyze(query, opts) {
    opts = opts || {};
    const r = await this._request('POST', '/api/engine/analyze', {
      query, industry: opts.industry || '', target: opts.target || '对话助手',
    });
    return r.data;
  }

  /** 报价预估 */
  async quote(query, monthlyCalls, dataTokens) {
    const r = await this._request('POST', '/api/billing/quote', { query, monthlyCalls, dataTokens });
    return r.data;
  }

  /** 知识卡列表 */
  async listCards() {
    const r = await this._request('GET', '/api/knowledge-cards');
    return r.data;
  }

  /** 单张知识卡 */
  async getCard(packId) {
    const r = await this._request('GET', '/api/knowledge-card/' + packId);
    return r.data;
  }

  /** 能力包注册表 */
  async listPacks() {
    const r = await this._request('GET', '/api/packs');
    return r.data;
  }

  /** 神经能力推荐 */
  async neuralRecommend(industry) {
    const r = await this._request('POST', '/api/neural/recommend', { industry });
    return r.data;
  }

  /** 生成评估报告 */
  async generateReport(query, opts) {
    opts = opts || {};
    const r = await this._request('POST', '/api/report/pdf', {
      query, industry: opts.industry || '', target: opts.target || '对话助手', webhook: opts.webhook || '',
    });
    return r.data;
  }

  /** 计费标准 */
  async getPrices() {
    const r = await this._request('GET', '/api/billing/prices');
    return r.data;
  }

  /* ===== 客户接口（需 Key） ===== */

  /** 账户信息 */
  async me() {
    const r = await this._request('GET', '/api/auth/me');
    return r.data;
  }

  /** 用量明细 */
  async usage(limit) {
    const r = await this._request('GET', '/api/auth/usage?limit=' + (limit || 20));
    return r.data;
  }

  /** 充值 */
  async recharge(amount) {
    const r = await this._request('POST', '/api/auth/recharge', { amount });
    return r.data;
  }

  /** 我的报告 */
  async myReports() {
    const r = await this._request('GET', '/api/auth/reports');
    return r.data;
  }
}

/* 浏览器兼容 */
if (typeof window !== 'undefined') window.ASHClient = ASHClient;
/* Node.js 模块 */
if (typeof module !== 'undefined') module.exports = ASHClient;
