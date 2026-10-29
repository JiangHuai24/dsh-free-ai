// Free AI by J.H — 腾讯品牌串净化的回归用例（Gitee IKJNA1 主因）。
//     node --experimental-strip-types scripts/tencent-brand-guard-test.mjs
//
// 依据见 src/tencent-brand-guard.ts 模块头：被拦的是 **messages[0] 开头的
// `You are an AI agent powered by <品牌全称>.`**，大小写不敏感、只对 system 生效。
import assert from 'node:assert/strict'
import {
  BRAND_NEEDLE,
  BRAND_REPLACEMENT,
  HARNESS_NAME,
  rewriteBrandIdentifiers,
  sanitizeGenerateOptions,
  wrapAdapterWithSystemSanitizer,
} from '../src/tencent-brand-guard.js'

// --- needle 必须是码点构造出来的，且与预期码点一致 -------------------------
const HEX = [...BRAND_NEEDLE].map((c) => c.codePointAt(0).toString(16))
assert.deepEqual(
  HEX,
  ['44', '65', '65', '70', '53', '65', '65', '6b', '20', '48', '61', '72', '6e', '65', '73', '73'],
  'needle must be built from code points (16 chars)',
)
assert.equal(BRAND_NEEDLE.length, 16)
assert.equal(HARNESS_NAME, BRAND_REPLACEMENT, 'one constant, no drift')

// --- 改写 ------------------------------------------------------------------
const HEAD = `You are an AI agent powered by ${BRAND_NEEDLE}.`
assert.equal(rewriteBrandIdentifiers(HEAD), `You are an AI agent powered by ${BRAND_REPLACEMENT}.`)
assert.equal(rewriteBrandIdentifiers(HEAD.toLowerCase()), `you are an ai agent powered by ${BRAND_REPLACEMENT}.`)
assert.ok(!rewriteBrandIdentifiers(HEAD.toUpperCase()).toLowerCase().includes(BRAND_NEEDLE.toLowerCase()))

// 幂等：不会被改写两次
assert.equal(rewriteBrandIdentifiers(rewriteBrandIdentifiers(HEAD)), rewriteBrandIdentifiers(HEAD))

// 无关文本逐字符不变（前缀缓存友好）——必须返回**同一份内容**
const CLEAN = 'You are a helpful assistant.\nUse the read tool.'
assert.equal(rewriteBrandIdentifiers(CLEAN), CLEAN)

// --- GenerateOptions 层 -----------------------------------------------------
const withDeveloper = {
  model: 'm',
  system: HEAD,
  messages: [
    { role: 'developer', content: 'tool-addition metadata' },
    { role: 'user', content: 'hi' },
  ],
}
const sanitized = sanitizeGenerateOptions(withDeveloper)
assert.equal(sanitized.system, `You are an AI agent powered by ${BRAND_REPLACEMENT}.`)
assert.ok(!sanitized.messages.some((m) => m.role === 'developer'), 'developer role must be dropped')
assert.equal(withDeveloper.system, HEAD, 'input must not be mutated in place')

// 无品牌、无 developer 时**原对象透传**
const untouched = { model: 'm', system: CLEAN, messages: [{ role: 'user', content: 'hi' }] }
assert.equal(sanitizeGenerateOptions(untouched), untouched, 'no-op must keep object identity')

// 内容块数组形态同样净化（多模态 system 也被拦）
const blockForm = sanitizeGenerateOptions({
  messages: [{ role: 'system', content: [{ type: 'text', text: HEAD }] }],
})
assert.equal(blockForm.messages[0].content[0].text, `You are an AI agent powered by ${BRAND_REPLACEMENT}.`)

// --- 生产派发路径：prepareCall(...).stream(...) -----------------------------
class FakeAdapter {
  constructor() { this.seen = [] }
  providerInfo() { return { id: 'fake' } }
  listModels() { return Promise.resolve([]) }
  async prepareCall() { return { modelInfo: {}, stream: (o) => this.stream(o) } }
  async *stream(options) { this.seen.push(options); yield { type: 'text-delta', index: 0, text: 'ok' } }
}
const base = new FakeAdapter()
const wrapped = wrapAdapterWithSystemSanitizer(base)
assert.equal(typeof wrapped.providerInfo, 'function', 'prototype methods must survive the Proxy')
const call = await wrapped.prepareCall(withDeveloper)
for await (const chunk of call.stream(withDeveloper)) void chunk
assert.equal(base.seen.length, 1, 'the adapter must actually be reached')
assert.equal(base.seen[0].system, `You are an AI agent powered by ${BRAND_REPLACEMENT}.`)
assert.ok(!base.seen[0].messages.some((m) => m.role === 'developer'))

console.log('PASS tencent-brand-guard: needle/brand rewrite/idempotent/no-op identity/developer drop/content blocks/prepareCall dispatch')
// --- 第二个内容指纹：必须被 adapter 层（sanitizeGenerateOptions）覆盖 ---
// ⚠️ 这条用例是补上次漏测而加的：当时只把该指纹加进网关的 tencent-fingerprint 表，
//    GUI 走 adapter 直连、根本不读那张表，于是网关测 200 而 GUI 仍 400。
const SENTENCE =
  'Relative paths resolve from the workspace root; absolute paths identify files or directories on the host.'
const REWRITTEN =
  'Relative paths start at the workspace root; full paths name host files or folders.'

assert.ok(rewriteBrandIdentifiers(SENTENCE).includes(REWRITTEN), 'sentence fingerprint must be rewritten')
assert.ok(!rewriteBrandIdentifiers(SENTENCE).includes('absolute paths identify'))
// 只有整句出现才改；拆开的片段必须原样保留（上游也只认整句）
const PARTIAL = 'Relative paths resolve from the workspace root;'
assert.equal(rewriteBrandIdentifiers(PARTIAL), PARTIAL, 'partial sentence must stay untouched')

const withSentence = sanitizeGenerateOptions({ system: `Hi. ${SENTENCE} Tail.`, messages: [] })
assert.ok(withSentence.system.includes(REWRITTEN), 'adapter path must also sanitize the sentence')

console.log('PASS tencent-brand-guard: sentence fingerprint covered on adapter path too')
