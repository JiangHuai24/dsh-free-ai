window.__ModuleLoader__.load({
  id: 'free-ai-by-jh',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const zh = typeof navigator !== 'undefined' && /^zh\b/i.test(navigator.language || '')

    const text = {
      title: zh ? '免费模型渠道' : 'Free AI channels',
      hint: zh ? '13 条账号渠道：浏览器登录、账号池、每日签到领积分、模型黑名单与本地 OpenAI 兼容网关。' : 'Thirteen account channels with login, account pool, daily check-in and a local OpenAI-compatible gateway.',
      accountsTab: zh ? '账号' : 'Accounts',
      modelsTab: zh ? '模型' : 'Models',
      accountsLabel: zh ? '账号' : 'accounts',
      modelsLabel: zh ? '模型' : 'models',
      pointsLabel: zh ? '剩余积分' : 'Credits',
      add: zh ? '添加账号' : 'Add account',
      refreshAll: zh ? '续期' : 'Refresh',
      balance: zh ? '刷新余额' : 'Refresh balance',
      claimAll: zh ? '一键领取' : 'Claim all',
      test: zh ? '测试' : 'Test',
      refresh: zh ? '续期' : 'Refresh',
      disable: zh ? '停用' : 'Disable',
      enable: zh ? '启用' : 'Enable',
      remove: zh ? '移除' : 'Remove',
      on: zh ? '已启用' : 'Enabled',
      off: zh ? '已停用' : 'Disabled',
      ago: zh ? '前' : 'ago',
      now: zh ? '刚刚' : 'just now',
      noAccounts: zh ? '还没有账号。登录入口将在下一步接入。' : 'No accounts yet.',
      pending: zh ? '待接入' : 'Coming soon',
      saved: zh ? '已保存，重载插件后生效。' : 'Saved. Reload the plugin to apply.',
      failed: zh ? '操作失败' : 'Failed',
      note: zh ? 'CodeBuddy 与 CodeArts 默认关闭。停用/移除只改本地账号记录，重载插件后生效。' : 'CodeBuddy and CodeArts are off by default.',
      picks: zh ? '推荐项目' : 'Recommended',
      picksHint: zh ? '同一套 DSH 插件生态里，这两件最常用。' : 'Two companions from the same plugin family.',
    }

    const CHANNELS = [
      { id: 'workbuddy', name: 'WorkBuddy', org: zh ? '腾讯' : 'Tencent' },
      { id: 'lobsterai', name: 'LobsterAI', org: zh ? '有道' : 'Youdao' },
      { id: 'qoder', name: 'Qoder', org: zh ? '阿里系' : 'Alibaba' },
      { id: 'qodercn', name: 'Qoder 中国版', org: zh ? '阿里系' : 'Alibaba CN' },
      { id: 'trae', name: 'TRAE', org: zh ? '字节' : 'ByteDance' },
      { id: 'cline', name: 'Cline', org: 'Cline' },
      { id: 'loomy', name: 'Loomy', org: zh ? '讯飞' : 'iFlytek' },
      { id: 'raccoon', name: 'Raccoon', org: zh ? '商汤' : 'SenseTime' },
      { id: 'minimax', name: 'MiniMax Code', org: 'MiniMax' },
      { id: 'zcode', name: 'ZCode', org: zh ? '智谱' : 'Zhipu' },
      { id: 'gemini', name: 'Gemini', org: 'Google' },
      { id: 'buddy', name: 'CodeBuddy', org: zh ? '腾讯' : 'Tencent' },
      { id: 'codearts', name: 'CodeArts', org: zh ? '华为云' : 'Huawei Cloud' },
    ]
    const DEFAULT_OFF = ['buddy', 'codearts']
    const NAME = Object.fromEntries(CHANNELS.map((c) => [c.id, c.name]))

    const PICKS = [
      { id: 'agent-sync', name: zh ? '外部会话同步' : 'Agent Session Sync', desc: zh ? '把 WorkBuddy / ZCode / Codex 的会话镜像成 DSH 任务。' : 'Mirror sessions from other agents into DSH.', url: 'https://github.com/JiangHuai24/dsh-agent-sync' },
      { id: 'github-flow', name: zh ? '推送流程' : 'GitHub Push Flow', desc: zh ? '固化的推送流程：探测、重试、sha 校验、Release 与回执。' : 'A fixed push flow with probe, retry, sha check and receipt.', url: 'https://github.com/JiangHuai24/dsh-github-flow' },
    ]

    const CSS = [
      '.fa_root{display:flex;flex-direction:column;gap:12px}',
      '.fa_h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
      '.fa_t{font-size:14px;font-weight:680;color:var(--dsw-alias-label-primary);margin:0}',
      '.fa_sub{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary);max-width:70ch;line-height:1.6}',
      '.fa_stats{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.fa_stats b{color:var(--dsw-alias-label-primary);font-weight:640;font-variant-numeric:tabular-nums}',
      '.fa_toolbar{display:flex;gap:8px;flex-wrap:wrap}',
      '.fa_btn{font-size:11.5px;padding:4px 10px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.fa_btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2))}',
      '.fa_btn:disabled{opacity:.45;cursor:not-allowed}',
      '.fa_btn.primary{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}',
      '.fa_tabs{display:flex;gap:14px;border-bottom:1px solid var(--dsw-alias-border-l1);padding-bottom:6px}',
      '.fa_tab{font-size:12px;color:var(--dsw-alias-label-tertiary);background:none;border:0;cursor:pointer;padding:0}',
      '.fa_tab.active{color:var(--dsw-alias-label-primary);font-weight:640}',
      '.fa_rows{display:flex;flex-direction:column;gap:6px}',
      '.fa_row{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 88%,transparent);min-height:46px}',
      '.fa_row.off{opacity:.6}',
      '.fa_avatar{width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 22%,transparent);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dsw-alias-label-secondary);flex:none}',
      '.fa_who{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1 1 auto}',
      '.fa_who b{font-size:12px;color:var(--dsw-alias-label-primary);font-weight:600}',
      '.fa_who span{font-size:10.5px;color:var(--dsw-alias-label-tertiary)}',
      '.fa_chip{font-size:10px;padding:1px 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none}',
      '.fa_badge{font-size:10.5px;padding:1px 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none}',
      '.fa_badge.win{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-secondary));border-color:color-mix(in srgb,var(--dsw-alias-state-warning-primary,var(--dsw-alias-label-secondary)) 45%,transparent)}',
      '.fa_badge.credit{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent)}',
      '.fa_actions{margin-left:auto;display:flex;gap:6px;flex-wrap:nowrap;flex:none}',
      '.fa_grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:8px}',
      '.fa_card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:9px 11px;background:color-mix(in srgb,var(--dsw-alias-bg-base) 88%,transparent);display:flex;flex-direction:column;gap:6px}',
      '.fa_card.off{opacity:.55}',
      '.fa_cardtop{display:flex;align-items:center;gap:8px}',
      '.fa_name{font-size:12.5px;font-weight:620;color:var(--dsw-alias-label-primary)}',
      '.fa_pill{margin-left:auto;font-size:10.5px;padding:1px 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary)}',
      '.fa_pill.on{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,transparent)}',
      '.fa_meta{font-size:11px;color:var(--dsw-alias-label-tertiary);display:flex;gap:10px;flex-wrap:wrap}',
      '.fa_note{margin:0;font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.6}',
      '.fa_pickwrap{display:flex;gap:6px;flex-wrap:wrap;padding:8px;border:1px dashed var(--dsw-alias-border-l2);border-radius:10px}',
      '.fa_pick{display:flex;flex-direction:column;gap:4px;text-decoration:none;color:inherit}',
      '.fa_pickname{font-size:12.5px;font-weight:620;color:var(--dsw-alias-label-primary)}',
      '.fa_pickdesc{font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:1.55}',
    ].join('')

    let rpcSeq = 0
    function rpc(method, payload) {
      rpcSeq += 1
      const rpcId = 'fa-' + rpcSeq + '-' + Date.now()
      return fetch('/api/channel-pack', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'client-request', rpcId, method: 'channel-pack', payload: { method, payload } }),
      }).then((r) => r.json()).then((doc) => {
        const result = doc && doc.result
        if (!result) throw new Error('empty rpc result')
        if (result.ok === false) throw new Error((result.error && result.error.message) || 'rpc failed')
        return result.value
      })
    }

    function useCss() {
      React.useEffect(() => {
        const id = 'free-ai-by-jh-style'
        if (document.getElementById(id)) return
        const el = document.createElement('style')
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
      }, [])
    }

    function agoText(ms) {
      if (!ms) return ''
      const diff = Date.now() - ms
      if (diff < 60_000) return text.now
      const mins = Math.round(diff / 60_000)
      if (mins < 60) return mins + ' ' + (zh ? '分钟' : 'min') + text.ago
      const hours = Math.round(mins / 60)
      if (hours < 24) return hours + ' ' + (zh ? '小时' : 'h') + text.ago
      return Math.round(hours / 24) + ' ' + (zh ? '天' : 'd') + text.ago
    }

    function pointsLabel(raw) {
      const s = String(raw || '')
      if (!s) return ''
      if (s.includes('今天已领')) return zh ? '今日已领' : 'Claimed'
      if (s.includes('无签到')) return zh ? '无签到' : 'No check-in'
      if (s.includes('未开启')) return zh ? '有账号未开启' : 'Some off'
      if (s.includes('手动')) return zh ? '需手动签到' : 'Manual'
      return s.length > 12 ? s.slice(0, 12) + '…' : s
    }

    function Row({ account, points, onAction, busy }) {
      const act = (action) => onAction(account.id, action)
      return h('div', { className: 'fa_row' + (account.enabled ? '' : ' off') },
        h('div', { className: 'fa_avatar' }, (account.nickname || '?').slice(0, 1)),
        h('div', { className: 'fa_who' },
          h('b', null, account.nickname),
          h('span', null, (account.enabled ? text.on : text.off) + (account.createdAt ? ' · ' + agoText(account.createdAt) : '')),
        ),
        h('span', { className: 'fa_chip' }, NAME[account.provider] || account.provider),
        points ? h('span', { className: 'fa_badge win' }, pointsLabel(points)) : null,
        h('div', { className: 'fa_actions' },
          h('button', { className: 'fa_btn', disabled: busy, onClick: () => act('test') }, text.test),
          h('button', { className: 'fa_btn', disabled: busy, onClick: () => act('refresh') }, text.refresh),
          h('button', { className: 'fa_btn', disabled: busy, onClick: () => act(account.enabled ? 'disable' : 'enable') }, account.enabled ? text.disable : text.enable),
          h('button', { className: 'fa_btn', disabled: busy, onClick: () => act('remove') }, text.remove),
        ),
      )
    }

    function SettingsSection() {
      useCss()
      const [status, setStatus] = React.useState(null)
      const [tab, setTab] = React.useState('accounts')
      const [busyId, setBusyId] = React.useState('')
      const [notice, setNotice] = React.useState('')
      const [error, setError] = React.useState('')
      const [picker, setPicker] = React.useState(false)
      const [busyAll, setBusyAll] = React.useState('')

      const load = React.useCallback(() => {
        fetch('/free-ai/status').then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then((doc) => { setStatus(doc); setError('') })
          .catch((e) => setError(String(e && e.message ? e.message : e)))
      }, [])
      React.useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t) }, [load])

      const accounts = (status && Array.isArray(status.accounts)) ? status.accounts : []
      const excluded = new Set(status && Array.isArray(status.exclude) ? status.exclude : DEFAULT_OFF)
      const providers = Object.keys((status && status.services) || {})
      const enabledAccounts = accounts.filter((a) => a.enabled).length

      const onAction = (id, action) => {
        setBusyId(id); setNotice(''); setError('')
        if (action === 'remove' && typeof window !== 'undefined' && !window.confirm(zh ? '确定移除这个账号？' : 'Remove this account?')) { setBusyId(''); return }
        if (action === 'test' || action === 'refresh') {
          const call = action === 'test' ? rpc('account.test', { accountId: id }) : rpc('account.refresh', { accountId: id })
          setNotice(action === 'test' ? (zh ? '测试中…' : 'Testing…') : (zh ? '续期中…' : 'Refreshing…'))
          call.then(() => { setNotice(action === 'test' ? (zh ? '测试通过' : 'Test passed') : (zh ? '续期完成' : 'Refreshed')); load() })
            .catch((e) => setError(String(e && e.message ? e.message : e)))
            .finally(() => setBusyId(''))
          return
        }
        fetch('/free-ai/account', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, action }) })
          .then((r) => r.json())
          .then((doc) => { if (doc && doc.ok) { setNotice(text.saved); load() } else setError(String((doc && doc.error) || text.failed)) })
          .catch((e) => setError(String(e && e.message ? e.message : e)))
          .finally(() => setBusyId(''))
      }

      const providerList = () => [...new Set(accounts.map((a) => a.provider))].filter((p) => !excluded.has(p))

      const refreshAll = () => {
        const targets = accounts.filter((a) => a.refreshable !== false)
        setBusyAll('refresh'); setNotice(zh ? '批量续期…' : 'Refreshing…')
        let ok = 0
        Promise.allSettled(targets.map((a) => rpc('account.refresh', { accountId: a.id }).then(() => { ok += 1 })))
          .then(() => { setNotice((zh ? '续期完成：' : 'Refreshed: ') + ok + '/' + targets.length); load() })
          .finally(() => setBusyAll(''))
      }

      const claimAll = () => {
        const providers2 = providerList()
        setBusyAll('claim'); setNotice(zh ? '领取中…' : 'Claiming…')
        let ok = 0
        const failed = []
        Promise.allSettled(providers2.map((p) => rpc('credits.claimAll', { provider: p }).then(() => { ok += 1 }).catch((e) => { failed.push(p + ': ' + (e && e.message ? e.message : e)) })))
          .then(() => { setNotice((zh ? '领取完成：' : 'Claimed: ') + ok + '/' + providers2.length + (failed.length ? ' · ' + failed.slice(0, 2).join('; ') : '')); load() })
          .finally(() => setBusyAll(''))
      }

      const refreshBalances = () => {
        const providers2 = providerList()
        setBusyAll('balance'); setNotice(zh ? '刷新余额…' : 'Reading balances…')
        let total = 0; let got = 0
        Promise.allSettled(providers2.map((p) => rpc('credits.balances', { provider: p }).then((v) => {
          const b = v && (v.balance ?? v.total)
          if (typeof b === 'number' && Number.isFinite(b)) { total += b; got += 1 }
        })))
          .then(() => { setNotice((zh ? '余额合计：' : 'Credits: ') + (got ? total.toFixed(0) + ' (' + got + ')' : '—')); load() })
          .finally(() => setBusyAll(''))
      }

      const addAccount = (provider) => {
        setPicker(false); setNotice(zh ? '拉起登录…' : 'Starting login…'); setError('')
        rpc('account.create', { provider }).then((v) => {
          const url = v && v.loginUrl
          const accountId = v && v.accountId
          if (url && typeof window !== 'undefined') window.open(url, '_blank', 'noopener')
          if (!accountId) { setNotice(zh ? '已打开登录页，完成后点刷新' : 'Login page opened') ; return }
          setNotice(zh ? '等待登录完成…' : 'Waiting for login…')
          const started = Date.now()
          const timer = setInterval(() => {
            rpc('login.poll', { accountId }).then((r) => {
              if (r && r.done) {
                clearInterval(timer)
                if (r.success) { setNotice(zh ? '登录成功' : 'Logged in'); load() }
                else setError((zh ? '登录失败：' : 'Login failed: ') + String(r.error || ''))
              } else if (Date.now() - started > 120000) {
                clearInterval(timer); setNotice(zh ? '登录超时，请重试' : 'Login timed out')
              }
            }).catch(() => {})
          }, 2500)
        }).catch((e) => setError(String(e && e.message ? e.message : e)))
      }

      return h('div', { className: 'fa_root', 'data-plugin': 'free-ai-by-jh' },
        h('div', { className: 'fa_h' }, h('h3', { className: 'fa_t' }, text.title), h('p', { className: 'fa_sub' }, text.hint)),
        h('div', { className: 'fa_stats' },
          h('span', null, text.accountsLabel + ' ', h('b', null, enabledAccounts + '/' + accounts.length)),
          h('span', null, text.modelsLabel + ' ', h('b', null, String(providers.filter((p) => !excluded.has(p)).length))),
          status && status.lastCheckinResult ? h('span', null, h('b', null, status.lastCheckinResult)) : null,
        ),
        h('div', { className: 'fa_toolbar' },
          h('button', { className: 'fa_btn primary', disabled: busyAll !== '', onClick: () => setPicker(!picker) }, text.add),
          h('button', { className: 'fa_btn', disabled: busyAll !== '', onClick: refreshAll }, text.refreshAll),
          h('button', { className: 'fa_btn', disabled: busyAll !== '', onClick: refreshBalances }, text.balance),
          h('button', { className: 'fa_btn', disabled: busyAll !== '', onClick: claimAll }, text.claimAll),
        ),
        picker
          ? h('div', { className: 'fa_pickwrap' }, CHANNELS.filter((c) => !excluded.has(c.id)).map((c) =>
              h('button', { key: c.id, className: 'fa_btn', onClick: () => addAccount(c.id) }, c.name)))
          : null,
        h('div', { className: 'fa_tabs' },
          h('button', { className: 'fa_tab' + (tab === 'accounts' ? ' active' : ''), onClick: () => setTab('accounts') }, text.accountsTab + ' (' + accounts.length + ')'),
          h('button', { className: 'fa_tab' + (tab === 'models' ? ' active' : ''), onClick: () => setTab('models') }, text.modelsTab + ' (' + CHANNELS.length + ')'),
        ),
        tab === 'accounts'
          ? (accounts.length === 0
            ? h('p', { className: 'fa_note' }, text.noAccounts)
            : h('div', { className: 'fa_rows' }, accounts.map((a) => h(Row, {
              key: a.id,
              account: a,
              points: (status.points && status.points[a.provider]) || '',
              onAction,
              busy: busyId === a.id,
            }))))
          : h(ModelsTab, null),
        notice ? h('p', { className: 'fa_note' }, notice) : null,
        error ? h('p', { className: 'fa_note' }, text.failed + ': ' + error) : null,
        h('p', { className: 'fa_note' }, text.note),
      )
    }

    function ModelsTab() {
      return h('div', { className: 'fa_root' },
        h('div', { className: 'fa_grid' }, CHANNELS.map((c) => h('div', { key: c.id, className: 'fa_card' + (DEFAULT_OFF.includes(c.id) ? ' off' : '') },
          h('div', { className: 'fa_cardtop' },
            h('span', { className: 'fa_name' }, c.name),
            h('span', { className: 'fa_pill' + (DEFAULT_OFF.includes(c.id) ? '' : ' on') }, DEFAULT_OFF.includes(c.id) ? text.off : text.on),
          ),
          h('div', { className: 'fa_meta' }, h('span', null, c.org)),
        ))),
        h('div', { className: 'fa_sechead' }, h('span', { className: 'fa_sectitle' }, text.picks)),
        h('p', { className: 'fa_note' }, text.picksHint),
        h('div', { className: 'fa_grid' }, PICKS.map((p) => h('a', { key: p.id, className: 'fa_card fa_pick', href: p.url, target: '_blank', rel: 'noreferrer' },
          h('span', { className: 'fa_pickname' }, p.name),
          h('span', { className: 'fa_pickdesc' }, p.desc),
        ))),
      )
    }

    return {
      inject: ['slots'],
      __internals: { CHANNELS, PICKS, DEFAULT_OFF, text },
      apply(ctx) {
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register({ name: 'settings.section', id: 'free-ai-by-jh', order: 37, label: zh ? '免费模型渠道' : 'Free AI channels' }, SettingsSection),
        )
      },
    }
  },
})
