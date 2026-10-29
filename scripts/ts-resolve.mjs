/**
 * Node 的 TS 直跑（--experimental-strip-types）**不做扩展名替换**：
 * `import './x.js'` 不会落到 `x.ts`，而这些源码为配合 esbuild 打包必须写 `.js`。
 *
 * 本 hook 只补这一件事：导入 `foo.js` 时若磁盘上只有 `foo.ts`，就解析到 `.ts`。
 * 仅影响 `node --experimental-strip-types` 下的自测脚本，不参与打包产物。
 *
 *     node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/xxx-test.mjs
 */
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('.js') && (specifier.startsWith('./') || specifier.startsWith('../'))) {
      try {
        const resolved = nextResolve(specifier, context)
        if (resolved?.url) return resolved
      } catch {
        const parent = context.parentURL
        if (typeof parent === 'string' && parent.startsWith('file:')) {
          const target = new URL(specifier.slice(0, -3) + '.ts', parent)
          if (existsSync(fileURLToPath(target))) return { url: target.href, shortCircuit: true }
        }
        throw new Error(`cannot resolve ${specifier}`)
      }
    }
    return nextResolve(specifier, context)
  },
})
