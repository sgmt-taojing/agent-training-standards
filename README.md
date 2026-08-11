# ASH（Agent Standards Hub）· 智能体训练规范中心

静态上架包（GitHub Pages / 任意静态托管）。

部署：本目录推送到仓库 gh-pages 分支即可。

```bash
cd dist
git init && git add -A && git commit -m "market deploy $(date +%F)"
git branch -M gh-pages
git remote add origin <你的仓库地址>
git push -f origin gh-pages
```

注意：静态托管下「需求评估提交」自动降级为本地评估模式（结果立即可看，但不会进入线索库）；要落库需部署 `server/market-server.js`（node 环境）。
