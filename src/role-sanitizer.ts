/**
 * 协议适配：把 harness 下发的 `role:'developer'` 消息丢掉。
 *
 * ## 为什么需要
 *
 * DSH 0.1.7 引入了 `developer` 角色（承载工具增删元数据）。部分上游只认
 * `system`/`user`/`assistant`/`tool`，收到 `developer` 会直接 400。
 * 丢弃是**协议兼容**，与任何渠道校验无关：该角色只携带工具清单变更元数据，
 * 丢掉不损失对话语义。
 *
 * ## 为什么靠在注册点，而不是改 13 个适配器
 *
 * 少数适配器（cline / loomy / raccoon / qoder / zcode）不调
 * `normalizeHarnessMessages`，它们各自没有剥离 developer 的时机；注册点是
 * 所有适配器共有的唯一入口。
 *
 * ## 语义
 *
 * 1. **没有 developer 消息时返回原对象引用**（不制造新对象，对象身份不受影响）；
 * 2. 其余字段逐字节透传；
 * 3. **不改写任何正文内容** —— system 与 messages 的文本一律原样下发。
 *
 * @module src/role-sanitizer
 */

/**
 * 去掉 `role:'developer'` 消息。
 *
 * @param options dsh-llm 传给适配器的 `GenerateOptions`
 * @returns 需要改动时返回浅拷贝，否则返回入参本身
 */
export function sanitizeGenerateOptions<T>(options: T): T {
  if (options === null || typeof options !== 'object') return options
  const original = options as { messages?: unknown }
  const messages = original.messages
  if (!Array.isArray(messages)) return options
  const next: unknown[] = []
  let changed = false
  for (const message of messages) {
    if (message !== null && typeof message === 'object'
      && (message as { role?: unknown }).role === 'developer') {
      changed = true
      continue
    }
    next.push(message)
  }
  if (!changed) return options
  return { ...(options as object), messages: next } as T
}

/**
 * 把 {@link sanitizeGenerateOptions} 包到一个适配器上（注册点专用）。
 *
 * 生产路径只走 `adapter.prepareCall(...)` 返回的 `call.stream(options)`，
 * 从不直接调用顶层 `adapter.stream` —— 只包顶层会让修复在生产环境不生效。
 * 故两处都包，共用同一实现。
 *
 * 适配器是 class 实例：用 `Proxy` 而不是对象展开，否则原型方法会整体丢失；
 * `this` 必须绑回原适配器，私有字段才对 Proxy 可见。
 */
export function wrapAdapterWithRoleSanitizer<T extends object>(adapter: T): T {
  return new Proxy(adapter, {
    get(target, prop) {
      if (prop === 'stream') {
        return (options: unknown) => (target as unknown as {
          stream: (o: unknown) => AsyncIterable<unknown>
        }).stream.call(target, sanitizeGenerateOptions(options))
      }
      if (prop === 'prepareCall') {
        const original = Reflect.get(target, prop, target) as unknown
        if (typeof original !== 'function') return original
        return async (...args: unknown[]): Promise<unknown> => {
          const call = await (original as (...a: unknown[]) => Promise<unknown>).apply(
            target,
            args.length > 0 ? [sanitizeGenerateOptions(args[0]), ...args.slice(1)] : args,
          )
          if (call === null || typeof call !== 'object') return call
          const inner = (call as { stream?: unknown }).stream
          if (typeof inner !== 'function') return call
          return {
            ...(call as object),
            stream: (options: unknown) => (inner as (o: unknown) => AsyncIterable<unknown>)
              .call(target, sanitizeGenerateOptions(options)),
          }
        }
      }
      return Reflect.get(target, prop, target)
    },
  })
}
