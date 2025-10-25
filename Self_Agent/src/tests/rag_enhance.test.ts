import { describe, it } from './testharness.js';
import { composeCitedContext, compressHistory } from '../pipeline/rag_enhance.js';

describe('composeCitedContext', () => {
  it('dedups and truncates', () => {
    const cands = [
      { id: 'c1', text: 'hello world ' + 'x'.repeat(500), score: 0.9 },
      { id: 'c2', text: 'hello world ' + 'x'.repeat(500), score: 0.8 }, // duplicate
      { id: 'c3', text: 'another snippet', score: 0.7 },
    ];
    const { contextText } = composeCitedContext(cands, { maxSnippets: 5, maxCharsPerSnippet: 120, dedup: true });
    if (!contextText.includes('[#1') || !contextText.includes('[#2')) throw new Error('missing citations');
    if ((contextText.match(/hello world/g) || []).length !== 1) throw new Error('dedup failed');
  });
});

describe('compressHistory', () => {
  it('keeps last turns and summarizes earlier', () => {
    const hist = [
      { role: 'user', content: '我们计划做一个项目，需要里程碑' },
      { role: 'assistant', content: '建议分阶段推进' },
      { role: 'user', content: '下一步怎么做' },
      { role: 'assistant', content: '第一步收集需求' },
      { role: 'user', content: '好的' },
    ];
    const text = compressHistory(hist, { keepLast: 2, maxChars: 500 });
    if (!text.includes('对话历史要点')) throw new Error('missing summary heading');
    if (!text.includes('最近对话')) throw new Error('missing recent heading');
  });
});
