// Free AI by J.H —— 宿主入口（薄封装）。
//
// 除了挂载渠道包，这里还提供两个同源接口给设置页用：
//   GET  /free-ai/status  → 渠道状态（账号数、今日签到、是否默认关闭）
//   POST /free-ai/toggle  → 写 channels.json（exclude 列表），重载后生效
import * as pack from './pack.js'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

export const name = 'free-ai-by-jh'
export const inject = pack.inject
export const Config = pack.Config

const PROBE = 'D:\\WorkBuddy\\dsh-iso\\free-ai-probe.log'
/** pack.apply 之后由渠道包 provide('accountPool')，这里缓存给 HTTP 路由用。 */
let poolRef = null
function probe(line) {
  try { appendFileSync(PROBE, new Date().toISOString() + ' ' + line + '\n') } catch {}
}

const HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const CONFIG_DIR = join(HOME, 'free-ai')
const CONFIG_FILE = join(CONFIG_DIR, 'channels.json')
const PACK_DIR = join(HOME, 'channel-pack')

function readJson(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return fallback }
}

/** 用户在这里改的排除列表优先于插件配置（设置页开关写这个文件）。 */
function storedExclusions() {
  const doc = readJson(CONFIG_FILE, null)
  if (doc && Array.isArray(doc.exclude)) return doc.exclude.filter((id) => typeof id === 'string' && id.trim())
  return undefined
}

function channelStatus() {
  const state = readJson(join(PACK_DIR, 'state.json'), {})
  const checkin = readJson(join(PACK_DIR, 'auto-checkin.json'), {})
  const byProvider = {}
  for (const account of state.accounts || []) {
    if (!account || typeof account.provider !== 'string') continue
    const entry = byProvider[account.provider] || (byProvider[account.provider] = { accounts: 0, enabled: 0 })
    entry.accounts += 1
    if (account.enabled !== false) entry.enabled += 1
  }
  const points = {}
  for (const row of checkin.channels || []) {
    if (row && typeof row.provider === 'string') points[row.provider] = String(row.text || '')
  }
  const accounts = (state.accounts || [])
    .filter((a) => a && typeof a.provider === 'string')
    .map((a) => ({
      id: a.id,
      provider: a.provider,
      nickname: a.nickname || a.id,
      enabled: a.enabled !== false,
      refreshable: a.refreshable === true,
      createdAt: a.createdAt || 0,
      expiresAt: a.expiresAt || 0,
    }))
  return {
    checkedAt: Date.now(),
    accounts,
    lastCheckinDate: checkin.lastDate || null,
    lastCheckinResult: checkin.lastResult || null,
    services: byProvider,
    points,
    exclude: storedExclusions() ?? null,
  }
}

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => { chunks.push(c); if (chunks.length && Buffer.concat(chunks).length > 65536) req.destroy() })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', () => resolve(''))
  })
}

export function apply(ctx, config = {}) {
  probe('apply called; inject=' + JSON.stringify(pack.inject))
  const webServer = typeof ctx.get === 'function' ? ctx.get('webServer') : ctx.webServer

  if (webServer && typeof webServer.register === 'function') {
    try {
      webServer.register({ kind: 'exact', path: '/free-ai/status', handler: (req, res) => json(res, 200, channelStatus()) })
      webServer.register({
        kind: 'exact',
        path: '/free-ai/account',
        handler: async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
          let payload = {}
          try { payload = JSON.parse((await readBody(req)) || '{}') } catch { return json(res, 400, { ok: false, error: 'invalid json' }) }
          const id = String(payload.id || '').trim()
          const action = String(payload.action || '').trim()
          if (!id || !action) return json(res, 400, { ok: false, error: 'missing id/action' })
          try {
            if (poolRef && typeof poolRef.updateAccount === 'function') {
              if (action === 'disable') await poolRef.updateAccount(id, { enabled: false })
              else if (action === 'enable') await poolRef.updateAccount(id, { enabled: true })
              else if (action === 'remove') await poolRef.removeAccount(id)
              else return json(res, 400, { ok: false, error: 'unsupported action' })
            } else {
              const statePath = join(PACK_DIR, 'state.json')
              const state = readJson(statePath, null)
              if (!state || !Array.isArray(state.accounts)) return json(res, 500, { ok: false, error: 'state unreadable' })
              const account = state.accounts.find((a) => a && a.id === id)
              if (!account) return json(res, 404, { ok: false, error: 'account not found' })
              if (action === 'disable') account.enabled = false
              else if (action === 'enable') account.enabled = true
              else if (action === 'remove') state.accounts = state.accounts.filter((a) => a && a.id !== id)
              else return json(res, 400, { ok: false, error: 'unsupported action' })
              writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8')
            }
          } catch (error) {
            return json(res, 500, { ok: false, error: String(error && error.message) })
          }
          json(res, 200, { ok: true, reloadRequired: false, viaPool: Boolean(poolRef) })
        },
      })
      webServer.register({
        kind: 'exact',
        path: '/free-ai/toggle',
        handler: async (req, res) => {
          if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' })
          let payload = {}
          try { payload = JSON.parse((await readBody(req)) || '{}') } catch { return json(res, 400, { ok: false, error: 'invalid json' }) }
          const id = String(payload.id || '').trim()
          if (!id) return json(res, 400, { ok: false, error: 'missing id' })
          const current = new Set(storedExclusions() ?? ['buddy', 'codearts'])
          if (payload.enabled === true) current.delete(id)
          else current.add(id)
          mkdirSync(CONFIG_DIR, { recursive: true })
          writeFileSync(CONFIG_FILE, JSON.stringify({ exclude: [...current] }, null, 2), 'utf8')
          json(res, 200, { ok: true, exclude: [...current], reloadRequired: true })
        },
      })
      probe('routes registered')
    } catch (error) {
      probe('route register failed: ' + String(error && error.message))
    }
  } else {
    probe('webServer unavailable; routes skipped')
  }

  ctx.inject(['credentials', 'commands', 'llm'], scoped => {
    probe('inject callback fired')
    let stopped = false
    scoped.effect(() => () => { stopped = true }, 'free-ai-by-jh')
    void import('./pack.js').then(mod => {
      if (stopped) return
      try {
        const exclude = storedExclusions() ?? config.excludeChannels
        mod.apply(scoped, { ...config, excludeChannels: exclude })
        try { poolRef = (typeof scoped.get === 'function' ? scoped.get('accountPool') : scoped.accountPool) || null } catch { poolRef = null }
        probe('pack.apply ok; name=' + mod.name + '; exclude=' + JSON.stringify(exclude))
      } catch (error) {
        probe('pack.apply threw: ' + String(error && error.message))
      }
    }).catch(error => {
      probe('pack import failed: ' + String(error && error.message))
    })
  })
}
