// Chat Completions gateway regression: developer must map to system.
// Run: node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/openai-gateway-developer-test.mjs
import assert from 'node:assert/strict'
import { toGenerateOptions } from '../src/openai-gateway/messages.ts'

const controller = new AbortController()
const body = {
  model: 'buddy/deepseek-v4.1-flash',
  messages: [
    { role: 'developer', content: 'high priority instructions' },
    { role: 'user', content: 'hi' },
  ],
}
const options = await toGenerateOptions(body, controller.signal)
assert.equal(options.messages.length, 2)
assert.equal(options.messages[0].role, 'system', 'developer must become system')
assert.equal(options.messages[0].content[0].type, 'text')
assert.equal(options.messages[0].content[0].text, 'high priority instructions')
assert.equal(options.messages[1].role, 'user')

// Preserve relative ordering of system/developer directives.
const ordered = await toGenerateOptions({
  model: 'workbuddy/deepseek-v4.1-flash',
  messages: [
    { role: 'system', content: 's1' },
    { role: 'developer', content: 'd1' },
    { role: 'user', content: 'u1' },
  ],
}, controller.signal)
assert.deepEqual(ordered.messages.map(m => m.role), ['system', 'system', 'user'])
assert.deepEqual(ordered.messages.slice(0, 2).map(m => m.content[0].text), ['s1', 'd1'])
console.log('PASS openai-gateway developer -> system mapping')