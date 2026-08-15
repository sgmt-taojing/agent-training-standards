# ASH · Agent Standards Hub

**让训练智能体有章可循：一份规范 · 一组能力 · 一份报价 · 一封邮件**

🌐 公网体验：<https://sgmt-taojing.github.io/agent-training-standards/>

---

## 1. 客户在问什么？

> "我想训练一个智能体，但不知道该怎么做"

高频问题：
- 选型迷茫：NLP 还是 LLM？RAG 还是 Agent？
- 预算模糊：训练一个问答助手要花多少？
- 合规焦虑：数据从哪来？是否可商用？
- 路径复杂：7 大类知识、12 维度、几十种能力——无从下手
- 效果难评：训练完不知道好不好

## 2. ASH 定位：训练智能体的一站式规范中心

- **不卖模型**：中立第三方，不绑定任何 LLM/向量库/训练框架
- **卖规范 + 能力**：15 维知识卡、12 类神经能力、按词元计费 API、邮件全程通知

## 3. 5 大产品模块

| 模块 | 端点 | 说明 |
|---|---|---|
| 需求评估引擎 | `POST /api/engine/analyze` | 30 秒出 15 维需求卡 |
| 知识卡中心 | `GET /api/knowledge-cards` | 15 维 × 8 行业全覆盖 |
| 神经能力推荐 | `POST /api/neural/recommend` | 12 类能力按行业匹配 |
| 计费报价引擎 | `POST /api/billing/quote` | 按词元/订阅混合计费 |
| 评估报告生成 | `POST /api/report/pdf` | Markdown 即时 + PDF 异步 + 邮件 |

## 4. 15 维需求卡（缺一不闭环）

行业定位 / 目标用户 / 核心痛点 / 输入数据源 / 输出形式 / 合规边界 / 评估指标 / 工具依赖 / 成本结构 / 风险点 / 实施周期 / 团队配置 / 迭代路径 / 上游依赖 / 商业模式

## 5. 神经能力图谱 N1-N12

N1 意图识别 · N2 信息抽取 · N3 决策推理 · N4 多模态融合 · N5 多轮对话 · N6 工具调用 · N7 检索召回 · N8 逻辑推理 · N9 生成创作 · N10 合规审查 · N11 风格适配 · N12 评估反馈

## 6. 定价方案

| 模式 | 详情 |
|---|---|
| **按词元** | 输入 ¥2/百万 · 输出 ¥8/百万 · 数据 ¥20/百万 · 首月 100 万免费 |
| **年订阅** | ¥3,900/年 含 2,000 万词元（折扣率 50%） |
| **阶梯折扣** | 100M-1B 0.85× · >1B 0.7× |
| **熔断** | 月度预算阈值可配（默认 ¥10,000） |

## 7. 客户旅程

注册 → Key → 选场景 → 输入方向 → 需求卡 → 能力推荐 → 报价 → 订阅/充值 → 报告 → 周报/月账单 → 全程邮件通知

## 8. 3 行接入示例

```javascript
// JavaScript
import { ASH } from './sdk/ash.js';
const client = new ASH('http://localhost:8933', 'ash_your_key');
const card = await client.analyze('训练一个医疗问诊智能体');
console.log(card.dimensions.length, '维');  // → 15
```

```python
# Python
from ash_client import ASHClient
c = ASHClient('http://localhost:8933', 'ash_your_key')
card = c.analyze('训练一个医疗问诊智能体')
print(len(card['dimensions']), '维')  # → 15
```

```bash
# curl
curl -X POST http://localhost:8933/api/engine/analyze \
  -H "X-API-Key: ash_your_key" \
  -H "Content-Type: application/json" \
  -d '{"query":"训练一个医疗问诊智能体","industry":"医疗","target":"对话助手"}'
```

## 9. 技术栈

- 后端：Node.js 22（api-server-v2.js，零外部依赖）
- 存储：JSONL + JSON，单进程承载 10 万+ 客户
- 前端：纯 HTML + CSS + 原生 JS，秒开
- PDF：weasyprint + Chrome 无头双 fallback
- 邮件：SMTP STARTTLS + 发件箱兜底（.eml 落盘）
- SDK：JS + Python 双客户端，12 端点全覆盖

## 10. 安全设计

- API Key：SHA-256 哈希存储，原始 Key 仅注册时返回
- SMTP 凭据：macOS Keychain 读取，永不落盘明文
- 蒸馏合规：trust 分级 + FTS5 去重 + license 校验
- 客户隔离：所有查询带 clientId 过滤
- 商业代码：GitHub public repo 仅放 deploy-bundles
- 数据备份：每日 03:40 自动备份 + 30 天滚动

---

**详细产品手册（PDF 版）**：<https://sgmt-taojing.github.io/agent-training-standards/ash-intro.html>
