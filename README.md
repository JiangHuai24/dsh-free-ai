# Free AI by J.H

把 13 条免费模型渠道接进 DeepSeek Harness（DSH）：浏览器登录、账号池、每日签到领积分、
模型黑名单、本地 OpenAI 兼容网关。

原型来自 `dsh-codearts-auth`（Gitee `iJetLi/deepseek-harness-codearts`，MIT，
提交 `345f0a07`），经由 `dsh-our-free-model` 的 `vendor/channel-pack` 取出。

> **Gemini 渠道需要自备 OAuth 客户端**：设置环境变量 `CMDC_PAK_GOOGLE_CLIENT_ID` 与 `CMDC_PAK_GOOGLE_CLIENT_SECRET`（Google Cloud Console 建「桌面应用」类型客户端，登记重定向 URI `http://localhost:<端口>/oauth-callback`）。仓库不内置任何 Google 凭据。

## 目录

```
index.js              宿主入口（薄封装：把 pack.js 挂到 credentials/commands/llm 上）
pack.js               由 src/ 打包出的单文件运行时（当前生效的就是它）
src/                  完整 TypeScript 源码（159 个文件），改这里
locale/               zh.json / en.json
qoder-auth-wasm.wasm  Qoder 加密推理必需，必须与 pack.js 同目录
scripts/build-pack.mjs  用 esbuild 把 src/ 重新打包成 pack.js
tsconfig.json         tsc 构建配置
cordis.patch.yml      DSH bundle patch（id: free-ai-by-jh）
```

## 13 个渠道

| id | 渠道 | 归属 | 登录 |
|---|---|---|---|
| codearts | CodeArts | 华为云 | 浏览器 |
| buddy | WorkBuddy 国内版 | 腾讯 | 浏览器 |
| workbuddy | WorkBuddy 国际版 | 腾讯 | 浏览器 |
| lobsterai | LobsterAI | 有道 | 浏览器 |
| qoder / qodercn | Qoder / 中国版 | 阿里系 | 浏览器 |
| trae | TRAE | 字节 | 手机号 |
| cline | Cline | Cline | 浏览器 |
| loomy | Loomy | 讯飞 | 微信扫码 / 短信 |
| raccoon | Raccoon | 商汤 | 手机号 |
| minimax | MiniMax Code | MiniMax | 设备码 + PKCE |
| zcode | ZCode | 智谱 | 浏览器 + 验证码 |
| gemini | Gemini | Google | 本地回调 OAuth |

## 实现原理（分层）

```
DSH llm 请求
   │
   ▼
src/llm-adapter.ts          注册成 DSH 的 provider；选账号、包错误、算 token
   │
   ▼
src/account-pool.ts         账号池：轮换、限流、冷却、余额排序、OAuth 刷新
   │
   ▼
src/<渠道>-adapter.ts       把 DSH 的请求变成该渠道上游的线上格式
   │
   ▼
src/sse.ts                  SSE 流解析（各渠道事件形状归一到 DSH 事件）
   │
   ▼
src/channel-fetch.ts        出口（可选接代理），带 UA / 指纹
```

旁路：

| 模块 | 作用 |
|---|---|
| `<渠道>-product.ts` | 该渠道的模型清单、展示名、能力位 |
| `<渠道>-credits.ts` + `credits.ts` | 余额/积分查询与领取 |
| `auto-checkin.ts` | 每日自动签到调度（结果写 auto-checkin.json） |
| `account-probe.ts` | 账号可用性探测 |
| `captcha-*.ts` | 验证码供给（ZCode 那套最容易坏） |
| `dead-model-store.ts` | 上游下线的模型记下来，不再反复试 |
| `model-gate.ts` / `model-queue.ts` | 并发闸门与排队 |
| `token-ledger.ts` | 每个账号/模型/天的用量账本 |
| `openai-gateway/` | 本地 OpenAI 兼容端点（给外部客户端用） |
| `channel-pack-rpc.ts` | `/api/channel-pack`，浏览器页面读写账号/模型状态 |
| `channel-pack-store.ts` | 状态落盘：`$DSH_HOME/channel-pack/state.json` |

## 状态与凭据

- 状态：`$DSH_HOME/channel-pack/state.json`（可用 `DSH_CHANNEL_PACK_STATE_DIR` 覆盖）
- 账本：`token-ledger.json`；签到：`auto-checkin.json`
- 凭据：DSH 的 credentials store，ref 形如 `BUDDY_ACCOUNT_AB12CD34`

> 想沿用原来的 31 个账号：**保持目录名与 credentialRef 不变**即可；改名就要重新登录。
> `src/backup.ts` 提供导出/导入，迁移前先导一份。

## 改造入口（按你要改的东西找文件）

| 想改什么 | 改哪里 |
|---|---|
| 加一个新渠道 | 复制 `<渠道>.ts / -auth / -oauth / -adapter / -product / -credits` 六件套，在 `index.ts` 注册 |
| 登录方式 | `<渠道>-oauth.ts`、`<渠道>-auth.ts` |
| 模型清单/命名 | `<渠道>-product.ts`、`models.ts` |
| 请求/响应协议 | `<渠道>-adapter.ts`、`openai-compat.ts`、`sse.ts` |
| 签到与积分 | `<渠道>-credits.ts`、`credits.ts`、`auto-checkin.ts` |
| 限流/并发 | `account-pool.ts`、`model-queue.ts`、`retry-after.ts` |
| 网关对外形状 | `openai-gateway/` |

## 构建

```bash
# 源码改了以后必须重新打包，index.js 挂的是 pack.js
npm run build:pack      # 需要 esbuild；可用 FREE_AI_ESBUILD_DIR 指向已装 esbuild 的目录

# 想直接跑 lib/（不经单文件打包）
npm run build           # tsc -p tsconfig.json → lib/
```

打包时 `@deepseek-ai/*` 与 `node:*` 保持 external —— 必须用宿主同一份实例，
否则 cordis 上下文与 llm 注册表的 identity 检查会失败。

## 安装（⚠️ 先读）

```bash
dsh plugin --profile desktop add link:<仓库目录>
```

**不要和 dsh-our-free-model 同时启用**：两者都会注册 buddy / zcode / lobsterai 等
同名 provider，并共用 `$DSH_HOME/channel-pack` 状态目录，同时挂载会互相抢占。

正确顺序：先停用 OFM → 装本插件 → 重新登录或用 backup 导入账号。

## 隔离测试（不影响正在用的 DSH）

隔离环境：独立的 `DSH_HOME`，profile `iso` 从 web 模板生成。

```powershell
# 1. 把改动同步进隔离 profile
powershell -NoProfile -File scripts/sync-to-test-profile.ps1

# 2. 启动隔离实例（独立端口，独立 storages）
$env:DSH_HOME='<隔离 DSH_HOME>'
& '<DSH 安装目录>\resources\runtime\cli\bin\dsh.cmd' --profile iso --no-open
```

**为什么不能 `link:` 安装**：链接安装时 `pack.js` 按真实路径解析 `@deepseek-ai/*`，
而宿主提供的这些包在 app.asar 内、不在 profile 依赖里，于是启动报
`ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-credentials`。把插件**实体拷贝**进
`profiles/iso/node_modules/` 后，Node 沿目录向上找到 profile 的模块解析路径，渠道包即可挂载。
