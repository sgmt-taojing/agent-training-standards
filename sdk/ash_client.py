#!/usr/bin/env python3
"""
ASH (Agent Standards Hub) Python 客户端 SDK

安装：直接 import 或 pip install ash-sdk（规划中）
用法：
    from ash_client import ASHClient
    client = ASHClient('http://localhost:8933', 'ash_your_key')
    card = client.analyze('训练一个医疗问诊智能体')

License: MIT
"""
import json
import urllib.request
import urllib.error
import urllib.parse
from typing import Optional, Dict, Any


class ASHClient:
    """ASH 智能体训练规范中心 — Python SDK"""

    def __init__(self, base_url: str = 'http://localhost:8933', api_key: str = ''):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key

    def _request(self, method: str, path: str, body: Optional[Dict] = None) -> Dict[str, Any]:
        url = self.base_url + path
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['X-API-Key'] = self.api_key
        data = json.dumps(body).encode('utf-8') if body else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            try:
                return json.loads(e.read().decode('utf-8'))
            except Exception:
                return {'ok': False, 'error': f'HTTP {e.code}: {e.reason}'}
        except Exception as e:
            return {'ok': False, 'error': str(e)}

    # ===== 公共接口 =====

    def register(self, name_or_obj, contact: str = '') -> Dict:
        if isinstance(name_or_obj, dict):
            name = str(name_or_obj.get('name', '匿名客户'))[:60].strip()
            contact = (name_or_obj.get('contact', '') or contact or '').strip()
        else:
            name = str(name_or_obj or '匿名客户')[:60].strip()
        """注册客户 → 返回 apiKey（自动保存到实例）"""
        r = self._request('POST', '/api/auth/register', {'name': name, 'contact': contact})
        if r.get('ok') and r.get('apiKey'):
            self.api_key = r['apiKey']
        return r

    def analyze(self, query: str, industry: str = '', target: str = '对话助手') -> Dict:
        """需求评估（核心端点）→ 结构化需求卡"""
        return self._request('POST', '/api/engine/analyze',
                             {'query': query, 'industry': industry, 'target': target})

    def quote(self, query: str, monthly_calls: int = 10000, data_tokens: int = 0) -> Dict:
        """报价预估"""
        return self._request('POST', '/api/billing/quote',
                             {'query': query, 'monthlyCalls': monthly_calls, 'dataTokens': data_tokens})

    def list_cards(self) -> Dict:
        """知识卡列表（8 张）"""
        return self._request('GET', '/api/knowledge-cards')

    def list_knowledge_cards(self, category: str = '', q: str = '') -> Dict:
        """知识卡查询（分类/关键词筛选）"""
        qs = []
        if category: qs.append('category=' + urllib.parse.quote(category))
        if q: qs.append('q=' + urllib.parse.quote(q))
        path = '/api/knowledge-cards' + ('?' + '&'.join(qs) if qs else '')
        return self._request('GET', path)

    def health(self) -> Dict:
        """健康检查"""
        return self._request('GET', '/api/health')

    def get_card(self, pack_id: str) -> Dict:
        """单张知识卡（15 维度）"""
        return self._request('GET', f'/api/knowledge-card/{pack_id}')

    def list_packs(self) -> Dict:
        """能力包注册表"""
        return self._request('GET', '/api/packs')

    def neural_recommend(self, industry: str) -> Dict:
        """行业→神经能力推荐"""
        return self._request('POST', '/api/neural/recommend', {'industry': industry})

    def generate_report(self, query: str, industry: str = '', target: str = '对话助手',
                        webhook: str = '') -> Dict:
        """生成评估报告（MD 即时 + PDF 异步）"""
        payload = {'query': query, 'industry': industry, 'target': target}
        if webhook:
            payload['webhook'] = webhook
        return self._request('POST', '/api/report/pdf', payload)

    def get_prices(self) -> Dict:
        """计费标准"""
        return self._request('GET', '/api/billing/prices')

    # ===== 客户接口（需 Key） =====

    def me(self) -> Dict:
        """账户信息"""
        return self._request('GET', '/api/auth/me')

    def usage(self, limit: int = 20) -> Dict:
        """用量明细"""
        return self._request('GET', f'/api/auth/usage?limit={limit}')

    def subscribe(self, plan: str = 'standard') -> Dict:
        """订阅（年付 ¥3,900 含 2,000 万词元）"""
        return self._request('POST', '/api/auth/subscribe', {'plan': plan})

    def recharge(self, amount: float, method: str = 'alipay') -> Dict:
        """充值（管理员手动入账）"""
        return self._request('POST', '/api/auth/recharge', {'amount': amount, 'method': method})

    def request_recharge(self, amount: float, method: str = 'alipay') -> Dict:
        """充值申请（客户提交，等运营确认）"""
        return self._request('POST', '/api/auth/recharge-request', {'amount': amount, 'method': method})

    def cancel_recharge(self, order_id: str) -> Dict:
        """撤销充值申请"""
        return self._request('POST', '/api/auth/recharge-cancel', {'orderId': order_id})

    def orders(self) -> Dict:
        """我的订单"""
        return self._request('GET', '/api/auth/orders')

    def my_reports(self) -> Dict:
        """我的报告列表"""
        return self._request('GET', '/api/auth/reports')


if __name__ == '__main__':
    # 自测
    c = ASHClient('http://localhost:8933')
    print('=== 健康检查 ===')
    import urllib.request
    try:
        h = urllib.request.urlopen(c.base_url + '/api/health', timeout=5)
        print('OK' if h.status == 200 else f'HTTP {h.status}')
    except Exception as e:
        print(f'FAIL: {e}')

    print('\n=== 知识卡列表 ===')
    r = c.list_cards()
    if r.get('ok'):
        for card in r['cards']:
            print(f"  • {card.get('packId', '?')}: {card.get('definition', '')[:50]}...")
    else:
        print('  (服务不可用)')

# 别名：短名 ASH（同 JS 端 ASH 一致）
ASH = ASHClient
