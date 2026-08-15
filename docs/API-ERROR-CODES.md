# ASH API 错误码手册

> 错误码格式：`ASH-{HTTP状态}-{4位编号}`（如 ASH-400-0001）
> HTTP 状态沿用 RESTful 规范：2xx 成功、4xx 客户端、5xx 服务端
> 所有错误响应格式：`{"ok":false, "error":"人类可读消息", "code":"ASH-XXX-XXXX"}`

## 4xx 客户端错误

### 400 — 请求参数错误

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-400-0001` | 缺少必填字段 | Body 缺 `query` 等 | 检查 API 文档 |
| `ASH-400-0002` | 字段类型错误 | `amount` 应为数字但传字符串 | 修正类型 |
| `ASH-400-0003` | 字段值越界 | `amount < 500`（充值最低 ¥500）| 提高金额 |
| `ASH-400-0004` | JSON 解析失败 | Body 不是合法 JSON | 检查 JSON 格式 |
| `ASH-400-0005` | 请求体过大 | Body > 1MB | 拆分请求 |
| `ASH-400-0006` | 不支持的端点版本 | URL 含 `/v2/` 但未发布 | 使用 `/v1/` |

### 401 — 鉴权失败

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-401-0001` | 缺少 API Key | Header 无 `X-API-Key` 或 `Authorization` | 添加 Key |
| `ASH-401-0002` | API Key 无效 | Key 不存在或被撤销 | 重新注册 |
| `ASH-401-0003` | API Key 已过期 | 长期未使用被清理 | 重新注册 |
| `ASH-401-0004` | API Key 权限不足 | 免费 Key 访问付费端点 | 充值或订阅 |

### 403 — 权限拒绝

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-403-0001` | 资源不属于该客户 | 访问别人的报告 | 检查 ID 是否正确 |
| `ASH-403-0002` | 客户被禁用 | 违规或欠费停用 | 联系客服 |
| `ASH-403-0003` | 操作频率超限 | 触发限流（次/分钟）| 等待 Retry-After |

### 404 — 资源不存在

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-404-0001` | 端点不存在 | URL 拼错 | 检查 API 文档 |
| `ASH-404-0002` | 报告不存在 | reportId 已过期或被清理 | 重新生成报告 |
| `ASH-404-0003` | 知识卡不存在 | cardId 已下架 | 查看能力包列表 |

### 409 — 资源冲突

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-409-0001` | 订单已存在 | 重复提交充值申请 | 查看已有订单 |
| `ASH-409-0002` | 状态不允许操作 | 重复确认/已驳回的单 | 查看订单状态 |

### 422 — 业务校验失败

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-422-0001` | 余额不足 | 订阅/充值时余额不够 | 充值 |
| `ASH-422-0002` | 已订阅重复订阅 | 已开通 Pro 又订阅 | 续费或等待到期 |
| `ASH-422-0003` | 订阅额度超限 | 月调用超额 | 续费或充值 |
| `ASH-422-0004` | 内容违规 | 触发安全/合规拦截 | 修改输入 |

### 429 — 限流

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-429-0001` | 免费用户限流 | IP 60 req/min | 加 Key 升级 600/min |
| `ASH-429-0002` | 付费用户限流 | clientId 600 req/min | 等待或工单申请 |
| `ASH-429-0003` | 全局熔断 | 服务端流量过大 | 等待 5 分钟 |

## 5xx 服务端错误

### 500 — 内部错误

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-500-0001` | 未捕获异常 | 代码 Bug | 重试，附 requestId |
| `ASH-500-0002` | 数据库异常 | DB 锁/磁盘满 | 稍后重试 |
| `ASH-500-0003` | AI 模型调用失败 | 上游 5xx | 重试或换模型 |

### 502 — 上游错误

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-502-0001` | AI 模型超时 | 推理 >30s | 重试 |
| `ASH-502-0002` | AI 模型拒绝 | 内容安全拦截 | 修改输入 |

### 503 — 服务不可用

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-503-0001` | 维护中 | 系统升级 | 等待维护结束 |
| `ASH-503-0002` | 资源耗尽 | 服务端过载 | 等待 |

### 504 — 网关超时

| 错误码 | 含义 | 触发场景 | 用户应对 |
|---|---|---|---|
| `ASH-504-0001` | PDF 生成超时 | 内容过长 | 拆分请求 |

## 重试策略建议

| 错误码 | 是否重试 | 退避策略 |
|---|---|---|
| 400/401/403/404/422 | ❌ 不重试 | 修正后再调用 |
| 409 | ⚠️ 看场景 | 仅当状态未知时重试 |
| 429 | ✅ 指数退避 | 等待 `Retry-After` |
| 500/502/503/504 | ✅ 指数退避 | 1s → 2s → 4s → 8s（最多 5 次）|

## 客户端处理示例

```python
# Python
import time
import requests

def call_with_retry(url, headers, payload, max_retry=5):
    for i in range(max_retry):
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        data = r.json()
        if r.ok:
            return data
        code = data.get('code', '')
        # 不重试：客户端错误
        if r.status_code < 500 and not code.startswith('ASH-429'):
            raise Exception(f"客户端错误 [{code}]: {data.get('error')}")
        # 重试：服务端错误/限流
        if i < max_retry - 1:
            wait = int(r.headers.get('Retry-After', 2 ** i))
            print(f"⏳ {code} 等待 {wait}s 后重试...")
            time.sleep(wait)
        else:
            raise Exception(f"已达最大重试次数 [{code}]: {data.get('error')}")
```

```javascript
// JavaScript (Node.js)
async function callWithRetry(url, headers, payload, maxRetry = 5) {
  for (let i = 0; i < maxRetry; i++) {
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const data = await r.json();
    if (r.ok) return data;
    const code = data.code || '';
    // 不重试
    if (r.status < 500 && !code.startsWith('ASH-429')) {
      throw new Error(`客户端错误 [${code}]: ${data.error}`);
    }
    // 重试
    if (i < maxRetry - 1) {
      const wait = parseInt(r.headers.get('Retry-After') || (2 ** i), 10);
      console.log(`⏳ ${code} 等待 ${wait}s 后重试...`);
      await new Promise(r => setTimeout(r, wait * 1000));
    } else {
      throw new Error(`已达最大重试次数 [${code}]: ${data.error}`);
    }
  }
}
```

## 联系支持

- 邮箱：support@agentstandards.org（待定）
- 文档：https://sgmt-taojing.github.io/agent-training-standards/app/docs.html
- Bug 反馈：附 `requestId` + `code` + 重现步骤