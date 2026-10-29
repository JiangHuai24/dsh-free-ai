/**
 * System-prompt rewriting for Free AI by J.H — 三个**互相独立**的开关。
 *
 * 为什么需要：DSH 下发的 system 里混了三样东西，各自的取舍完全不同。
 *
 *  1. identity   —— 一行写死的模型声明（"powered by the <model> model"）。
 *                  它不随实际上游变化，13 条渠道服务的是完全不同的模型，
 *                  于是模型会自称错误、自评能力时按错模型打分。
 *  2. memory     —— meow-memory 的记忆系统说明（约 4.2KB），是工具用法而非事实。
 *  3. runCodeDocs—— "## Writing code for run_code" 段（约 50KB），PTC 的 SDK 类型声明。
 *
 * 每个开关默认 'keep'，一字不动；只动被显式打开的那一段。
 * **工具使用约定段（read/grep/run_code 那些行为规则）永远不动**——它才是
 * 工具调用行为一致性的来源；改它才是真的会让工具调用退化。
 *
 * @module src/system-rewrite
 */

/** 本框架的中性名称：只用产品缩写，不写品牌全称。 */
const HARNESS_NAME = 'DSH'

export type IdentityMode = 'keep' | 'neutral' | 'harness' | 'custom'
export type MemoryMode = 'keep' | 'strip'
export type RunCodeDocsMode = 'keep' | 'strip' | 'head'

export interface SystemRewriteConfig {
  /** keep = 不改；neutral = 中性 + 真实上游；harness = 只留框架；custom = 用 customText 整行替换 */
  identity?: IdentityMode
  /** identity === 'custom' 时使用，例如 "你是 CodeBuddy。" */
  customText?: string
  /** meow-memory 说明段：strip = 整段删除（会失去记忆工具的使用指引） */
  memory?: MemoryMode
  /** run_code SDK 段：strip = 整段删除；head = 只保留开头 headLines 行 */
  runCodeDocs?: RunCodeDocsMode
  /** runCodeDocs === 'head' 时保留的行数，默认 40 */
  headLines?: number
}

let current: SystemRewriteConfig = { identity: 'neutral', memory: 'keep', runCodeDocs: 'keep', headLines: 40 }

/** 由 index.ts 在激活时注入插件配置。 */
export function configureSystemRewrite(next: SystemRewriteConfig | undefined): void {
  current = { identity: 'neutral', memory: 'keep', runCodeDocs: 'keep', headLines: 40, ...(next ?? {}) }
}

export function currentSystemRewrite(): SystemRewriteConfig {
  return { ...current }
}

const MODEL_CLAIM = /^You are a coding agent powered by the .+ model\.?$/m
const MEMORY_HEAD = '【记忆系统】'
const MEMORY_TAIL = '\n`run_code` is the only tool'
const RUNCODE_HEAD = '## Writing code for run_code'

/** 只改被打开的段落，其余原样返回。同样的输入必得同样的输出（前缀缓存友好）。 */
export function rewriteSystem(
  system: string | undefined,
  meta: { provider?: string; model?: string } = {},
): string | undefined {
  if (typeof system !== 'string' || system.length === 0) return system
  let text = system

  // ① run_code SDK 文档（最大的一段，先切，避免后续定位偏移）
  const docsAt = text.indexOf(RUNCODE_HEAD)
  if (docsAt >= 0 && current.runCodeDocs !== 'keep') {
    if (current.runCodeDocs === 'strip') {
      text = text.slice(0, docsAt).trimEnd()
    } else {
      const keep = Math.max(1, Number(current.headLines) || 40)
      const head = text.slice(docsAt).split('\n').slice(0, keep).join('\n')
      text = text.slice(0, docsAt) + head
    }
  }

  // ② meow-memory 说明段
  if (current.memory === 'strip') {
    const at = text.indexOf(MEMORY_HEAD)
    if (at >= 0) {
      const tailAt = text.indexOf(MEMORY_TAIL, at)
      text = tailAt > at ? text.slice(0, at) + text.slice(tailAt + 1) : text.slice(0, at)
    }
  }

  // ③ 身份声明
  const mode = current.identity ?? 'keep'
  if (mode !== 'keep') {
    const upstream = [meta.provider, meta.model].filter(Boolean).join(' / ')
    let replacement: string
    if (mode === 'custom') {
      replacement = String(current.customText ?? '').trim() || `You are a coding agent running on ${HARNESS_NAME}.`
    } else if (mode === 'harness') {
      replacement = `You are a coding agent running on ${HARNESS_NAME}.`
    } else {
      replacement = upstream
        ? `You are a coding agent running on ${HARNESS_NAME}. This request is served upstream by ${upstream}.`
        : `You are a coding agent running on ${HARNESS_NAME}.`
    }
    if (MODEL_CLAIM.test(text)) text = text.replace(MODEL_CLAIM, replacement)
    else {
      const lines = text.split('\n')
      lines.splice(1, 0, replacement)
      text = lines.join('\n')
    }
  }

  return text
}
