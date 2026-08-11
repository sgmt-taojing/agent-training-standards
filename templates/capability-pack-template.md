# 能力包封装模板（Capability Pack Template）

> 用途：新能力域转正 / 能力包升级时，按本模板封装。对齐 Agent Skills 开放标准（SKILL.md + 元数据 + 资源）。
> 用法：复制本文件到 `packs/<pack-id>/`，填写全部字段；manifest.json 同步生成并注册到 `capability-registry.json`。

---

## 0. 封装前检查（转正门槛）

- [ ] 来源项目存在且为权威源 / 消费方关系明确（见 `_shared/knowledge-distillation-sop.md`）
- [ ] 资产清单可枚举（KB 条目数 / 模型数 / API 端点数 / 技能数）
- [ ] 三层模型（L1 数据 / L2 技能 / L3 API）至少具备两层
- [ ] 边界声明完整（capable / incapable / requires / compliance）
- [ ] 计费模型已定（A 订阅 / B 按量 / C 买断 / D 混合）
- [ ] 自进化环已接（EVOLUTION.md 存在，使用日志落点明确）
- [ ] 合规审计通过（蒸馏红线 / 隐私脱敏 / 免责声明）

---

## 1. 能力包标识

```yaml
pack_id: <domain>-<name>-pack          # 如 mingli-knowledge-pack
pack_name: <中文名称>
domain: <mingli|tcm|vision|hci|training|agent|其他>
version: 1.0.0                          # semver：patch=修真 minor=新资产 major=破坏性变更
source: [<权威源项目>...]
maturity: 1-5                           # 1=概念 2=建设 3=可用 4=运营 5=标杆
keywords: [<触发关键词，供匹配引擎使用>...]
```

## 2. 三层资产清单

```yaml
layers:
  L1_data:      # 训练引用层（License 买断）
    kbEntries: <数量>
    models: <数量>
    sftCases: <数量>
    dpoPairs: <数量>
    formats: [jsonl, db-snapshot, chatml, onnx, ...]
  L2_skill:     # 运行时技能层（订阅）
    skills: [<SKILL.md 名称>...]        # 对齐 Agent Skills 标准
    templates: [<模板文件>...]
  L3_api:       # 服务调用层（按量）
    endpoints: [<完整路径>...]
    auth: jwt | api-key                  # 鉴权方式
    rateLimit: <QPS>
```

## 3. 边界声明（必须完整，防过度承诺）

```yaml
boundary:
  capable:      # ✅ 明确能做什么（逐条列举）
    - <能力 1>
    - <能力 2>
  incapable:    # ❌ 明确不能做什么（逐条列举）
    - <限制 1>
    - <限制 2>
  requires:     # 🔧 客户需自备什么
    - <数据/算力/手续>
  compliance:   # ⚖️ 合规限制（医疗/命理/隐私/未成年人等）
    - <条款 1>
```

## 4. 计费模型

```yaml
billing:
  plan: A | B | C | D
  price: <基础价>
  unitPrice: <单价/条目或调用>
  domainFactor: 1.0 | 1.5              # 专业标注成本系数
  billingNote: <说明>
```

## 5. 自进化配置

```yaml
evolution:
  logSource: <使用日志/反馈落点>
  feedbackAggregator: <脚本或 API>
  evalGate: <评测脚本，pass 阈值>
  releaseChannel: stable | beta
```

## 6. 验收（封装完成后）

- [ ] `capability-registry.json` 已注册
- [ ] 匹配引擎实测可命中（`node scripts/capability-matcher.js "<该域需求描述>"`）
- [ ] 评估报告模板可生成
- [ ] EVOLUTION.md 已建
