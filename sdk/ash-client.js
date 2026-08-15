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


  /** 解包后端响应：{ok, data:{...}} → {...} ；{ok, ...} 原样返回 */
  _unwrap(r) {
    if (r.data && typeof r.data === 'object' && Object.keys(r.data).length === 2 && r.data.ok !== undefined && r.data.data !== undefined) {
      return r.data.data;
    }
    return r.data;
  }

    /* ===== 公共接口 ===== */

  /** 健康检查（无需 Key） */
  async health() {
    const r = await this._request('GET', '/api/health', null);
    return r.data;
  }

  /** 神经网络能力推荐（短名） */
  async recommend(industry, target) {
    const r = await this._request('POST', '/api/neural/recommend', {
      industry: industry || '', target: target || '对话助手',
    });
    return r.data;
  }

  /** 注册客户 → 返回 apiKey（兼容 register({name,contact}) 或 register(name,contact)） */
  async register(nameOrObj, contact) {
    let name, em;
    if (typeof nameOrObj === 'object' && nameOrObj) {
      name = String(nameOrObj.name || '匿名客户').slice(0, 60).trim();
      em = String(nameOrObj.contact || '').trim();
    } else {
      name = String(nameOrObj || '匿名客户').slice(0, 60).trim();
      em = String(contact || '').trim();
    }
    const r = await this._request('POST', '/api/auth/register', { name, contact: em });
    if (r.data.ok) this.apiKey = r.data.apiKey;
    return r.data;
  }

  /** 需求评估 → 需求卡 */
  async analyze(query, opts) {
    opts = opts || {};
    const r = await this._request('POST', '/api/engine/analyze', {
      query, industry: opts.industry || '', target: opts.target || '对话助手',
    });
    // 后端返回 {ok, id, card, ...}；同时兼容 {ok, data:{...}}
    return (r.data && r.data.card) ? r.data : (r.data.data || r.data);
  }

  /** 报价预估 */
  async quote(query, monthlyCalls, dataTokens) {
    const r = await this._request('POST', '/api/billing/quote', { query, monthlyCalls, dataTokens });
    return (r.data && r.data.monthlyCost !== undefined) ? r.data : (r.data.data || r.data);
  }

  /** 知识卡列表 */
  async listKnowledgeCards(opts) {
    const q = new URLSearchParams();
    if (opts && opts.category) q.set('category', opts.category);
    if (opts && opts.q) q.set('q', opts.q);
    const qs = q.toString();
    const r = await this._request('GET', '/api/knowledge-cards' + (qs ? '?' + qs : ''));
    return r.data;
  }

  async listCards() {
    const r = await this._request('GET', '/api/knowledge-cards');
    return (r.data && Array.isArray(r.data.cards)) ? r.data : (r.data.data || r.data);
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

  /** 订阅（年付 ¥3,900 含 2,000 万词元） */
  async subscribe(plan) {
    const r = await this._request('POST', '/api/auth/subscribe', { plan: plan || 'standard' });
    return r.data;
  }

  /** 充值（管理员手动入账） */
  async recharge(amount, method) {
    const r = await this._request('POST', '/api/auth/recharge', { amount: amount || 500, method: method || 'alipay' });
    return r.data;
  }

  /** 充值申请（客户提交，等运营确认） */
  async requestRecharge(amount, method) {
    const r = await this._request('POST', '/api/auth/recharge-request', { amount: amount || 500, method: method || 'alipay' });
    return r.data;
  }

  /** 撤销充值申请 */
  async cancelRecharge(orderId) {
    const r = await this._request('POST', '/api/auth/recharge-cancel', { orderId });
    return r.data;
  }

  /** 我的订单 */
  async orders() {
    const r = await this._request('GET', '/api/auth/orders');
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
if (typeof module !== "undefined") {
  const _exports = ASHClient;
  _exports.ASH = ASHClient;
  _exports.ASHClient = ASHClient;
  _exports.default = ASHClient;
  module.exports = _exports;
}
