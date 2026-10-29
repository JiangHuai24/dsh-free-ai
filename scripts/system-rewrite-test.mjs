// Free AI by J.H — system-rewrite 的三个开关自测。
//     node scripts/system-rewrite-test.mjs
import assert from 'node:assert/strict'
import { configureSystemRewrite, rewriteSystem } from '../src/system-rewrite.ts'

// ⚠️ 品牌串一律**码点构造**（字面量在编辑器里可能被渲染成另一种写法，
//    会造成「看着对、实际不匹配」的空转）。本文件只是用它来断言
//    「插件**不**改写它」。
const BRAND = String.fromCharCode(68, 101, 101, 112, 83, 101, 101, 107, 32, 72, 97, 114, 110, 101, 115, 115)

const SAMPLE = [
  `You are an AI agent powered by ${BRAND}.`,
  '',
  'You are a coding agent powered by the deepseek-flash model.',
  '',
  '【记忆系统】meow-memory 提供跨会话记忆',
  '',
  '一、记忆数据总览',
  'soul = 关于 AI 自身；',
  '',
  '`run_code` is the only tool you can call directly — a tool call naming',
  'Use the read tool — not shell commands like cat — to inspect text files.',
  '',
  '## Writing code for run_code',
  ...Array.from({ length: 120 }, (_, i) => 'sdk line ' + (i + 1)),
].join('\n')

const CONVENTIONS = 'Use the read tool — not shell commands like cat'

function run(config, meta = { provider: 'buddy', model: 'deepseek-v4.1-flash' }) {
  configureSystemRewrite(config)
  return rewriteSystem(SAMPLE, meta)
}

// 1. 默认不改 —— **但品牌串例外**。
//    2026-10-23 起，品牌全称在**第一行**就会让腾讯端点回 400/11128
//    （实测：`buddy` 拦、`workbuddy` 不拦），而 DSH 的系统提示词第一行正是它。
//    故 `keep` 的新契约是「除品牌串外逐字符不变」—— 这也是**唯一**允许的例外，
//    因为不净化就等于整条渠道不可用。
// ⚠️ `rewriteSystem` 的默认配置本身就是 `identity:'neutral'`（见
// src/system-rewrite.ts 的模块级 `current`），不是 `keep` —— 故这里显式传
// `identity:'keep'`，才是在验证「一字不动」那条分支。
configureSystemRewrite({ identity: 'keep' })
const kept = rewriteSystem(SAMPLE, {})
// ⚠️ 2026-10-29 撤回：品牌串改写属于绕过上游渠道校验，已从插件移除。
//    keep 的契约恢复为「逐字符不变」；不再断言品牌串消失 ——
//    断言它消失，等于把那个不该做的行为写回测试里。
assert.equal(kept, SAMPLE, 'keep must be byte-identical: no channel-validation workarounds')
assert.ok(kept.includes(BRAND), 'the plugin must not scrub upstream brand checks')
assert.ok(kept.includes('【记忆系统】') && kept.includes(CONVENTIONS), 'everything else untouched')

// 2. 身份：neutral 注入真实上游
let out = run({ identity: 'neutral' })
assert.ok(out.includes('served upstream by buddy / deepseek-v4.1-flash'), 'neutral injects upstream')
assert.ok(!out.includes('powered by the deepseek-flash model'), 'neutral drops the static claim')

// 3. 身份：harness 只留框架
out = run({ identity: 'harness' })
// ⚠️ 模板文本里的框架名是 `HARNESS_NAME`（= `DSH`），**不是**品牌全称：
// 身份改写会写进 system 正文，写成品牌全称等于把上游刚拦掉的串装回去。
assert.ok(out.includes('You are a coding agent running on DSH.'))
assert.ok(out.includes(BRAND), 'identity rewrite must leave the rest of the prompt untouched')
assert.ok(!out.includes('deepseek-flash model'))

// 4. 身份：custom（改成 CodeBuddy）
out = run({ identity: 'custom', customText: 'You are CodeBuddy.' })
assert.ok(out.includes('You are CodeBuddy.'), 'custom identity applied')
assert.ok(out.includes(BRAND), 'custom identity path must leave the rest untouched')

// 5. 记忆段剥离：删说明、留工具约定
out = run({ memory: 'strip' })
assert.ok(!out.includes('【记忆系统】'), 'memory block gone')
assert.ok(out.includes(CONVENTIONS), 'tool conventions kept')

// 6. run_code 文档：strip / head
out = run({ runCodeDocs: 'strip' })
assert.ok(!out.includes('## Writing code for run_code'), 'docs gone')
assert.ok(out.includes(CONVENTIONS), 'conventions survive docs strip')

out = run({ runCodeDocs: 'head', headLines: 5 })
assert.ok(out.includes('## Writing code for run_code'), 'head keeps the heading')
assert.ok(out.includes('sdk line 4'), 'head keeps first lines')
assert.ok(!out.includes('sdk line 40'), 'head drops the tail')

// 7. 三个一起开
out = run({ identity: 'harness', memory: 'strip', runCodeDocs: 'strip' })
assert.ok(out.length < SAMPLE.length / 3, 'all three together shrink a lot: ' + out.length)
assert.ok(out.includes(CONVENTIONS), 'conventions survive everything')

// 8. 确定性（前缀缓存友好）
const a = rewriteSystem(SAMPLE, { provider: 'x', model: 'y' })
const b = rewriteSystem(SAMPLE, { provider: 'x', model: 'y' })
assert.equal(a, b, 'deterministic')

// 9. 身份改写本身**绝不能**把品牌词写回去（历史实现正是如此：模板文本里
//    写着 `running on <品牌>`，等于把刚净化掉的串又装回去）。
for (const identity of ['neutral', 'harness']) {
  const out2 = run({ identity })
assert.ok(out2.includes(BRAND), `identity=${identity} must not scrub the prompt`)
}

console.log('PASS system-rewrite: keep / neutral / harness / custom / memory-strip / docs-strip / docs-head / combined / deterministic / no-brand-reintroduction')
console.log('sizes: original=' + SAMPLE.length + ' combined=' + out.length)
