import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiEvalRun, apiEvalGetRun, apiEvalExportUrl, apiAbGenerate, apiAbList, apiAbVote } from '@/services/selfAgent';

const Bar = ({ label, value }: { label: string; value: number }) => (
  <div className="mb-2">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{(value * 100).toFixed(1)}%</span>
    </div>
    <progress aria-label={label} value={Math.round(Math.max(0, Math.min(1, value)) * 100)} max={100} className="w-full h-2 [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:via-purple-500 [&::-webkit-progress-value]:to-pink-500 rounded"></progress>
  </div>
);

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = 'default';

  // Eval controls
  const [useSamples, setUseSamples] = useState(true);
  const [limit, setLimit] = useState(10);
  const [promptsText, setPromptsText] = useState('我在微信里关于健身聊过什么？总结要点。\n最近的谷歌文档里我写了哪些项目计划？');
  const [runId, setRunId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // A/B controls
  const [modelA, setModelA] = useState('modelA');
  const [modelB, setModelB] = useState('modelB');
  const [abPrompts, setAbPrompts] = useState('请总结我最近一周的锻炼记录\n看看我邮件里关于面试的安排，有哪些关键时间点？');
  const [abItems, setAbItems] = useState<any[]>([]);
  const [abLoading, setAbLoading] = useState(false);

  const prompts = useMemo(() => promptsText.split('\n').map(s => s.trim()).filter(Boolean), [promptsText]);
  const aPrompts = useMemo(() => abPrompts.split('\n').map(s => s.trim()).filter(Boolean), [abPrompts]);

  const runEval = async () => {
    try {
      setLoading(true);
      const body = useSamples
        ? { userId, source: 'training_samples' as const, limit }
        : { userId, source: 'adhoc' as const, prompts };
      const r = await apiEvalRun({ ...body, mode: 'retrieval-summary' });
      setRunId(r.runId);
      setSummary(r.summary);
    } catch (e: any) {
      alert(`评测失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshAb = async () => {
    const r = await apiAbList(userId);
    setAbItems(r.items || []);
  };

  const createAb = async () => {
    try {
      setAbLoading(true);
      await apiAbGenerate({ userId, prompts: aPrompts, modelA, modelB });
      await refreshAb();
    } catch (e: any) {
      alert(`创建失败: ${e.message || e}`);
    } finally {
      setAbLoading(false);
    }
  };

  const vote = async (id: string, choice: 'A' | 'B' | 'tie' | 'skip') => {
    await apiAbVote({ pairId: id, choice });
    await refreshAb();
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">评测与看板</h1>
        <div className="space-x-2">
          <button className="px-3 py-1 rounded bg-muted hover:bg-muted/80" onClick={() => navigate('/training/samples')}>返回训练样本</button>
        </div>
      </div>

      {/* 自动评测 */}
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-3">自动评测</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={useSamples} onChange={() => setUseSamples(true)} /> 使用训练样本（最近 {limit} 条）</label>
              <input type="number" aria-label="样本数量" title="样本数量" placeholder="数量" className="w-20 input input-bordered px-2 py-1 border rounded" value={limit} onChange={e => setLimit(Number(e.target.value)||10)} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={!useSamples} onChange={() => setUseSamples(false)} /> 使用自定义 Prompts</label>
            </div>
            {!useSamples && (
              <textarea aria-label="自定义Prompts" title="自定义Prompts" placeholder="每行一个 Prompt" className="w-full h-32 border rounded p-2 text-sm" value={promptsText} onChange={e => setPromptsText(e.target.value)} />
            )}
            <div>
              <button disabled={loading} className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-pink-500 text-white disabled:opacity-50" onClick={runEval}>{loading ? '评测中…' : '一键评测'}</button>
              {runId && (
                <span className="ml-3 text-sm text-muted-foreground">Run: {runId}</span>
              )}
            </div>
          </div>
          <div className="col-span-1">
            <div className="rounded border p-3">
              <h3 className="text-sm font-medium mb-2">评分概览</h3>
              {summary ? (
                <>
                  <Bar label="Style Adherence" value={summary.style ?? 0} />
                  <Bar label="Factuality" value={summary.factuality ?? 0} />
                  <Bar label="Helpfulness/Coherence" value={summary.helpfulness ?? 0} />
                  <div className="mt-2 text-xs text-muted-foreground">Total: {summary.total}</div>
                  <div className="mt-2 text-xs">
                    <a className="underline" href={apiEvalExportUrl(runId!, 'json')}>导出JSON</a>
                    <span className="mx-1">·</span>
                    <a className="underline" href={apiEvalExportUrl(runId!, 'csv')}>导出CSV</a>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">尚未生成评测结果</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 人审与 A/B */}
      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-3">人审与 A/B</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            <div className="flex gap-2">
              <input className="border rounded px-2 py-1 w-40" value={modelA} onChange={e => setModelA(e.target.value)} placeholder="模型A版本" />
              <input className="border rounded px-2 py-1 w-40" value={modelB} onChange={e => setModelB(e.target.value)} placeholder="模型B版本" />
              <button disabled={abLoading} className="px-3 py-1 rounded bg-muted hover:bg-muted/80" onClick={createAb}>{abLoading ? '创建中…' : '创建 A/B 任务'}</button>
              <button className="px-3 py-1 rounded bg-muted hover:bg-muted/80" onClick={refreshAb}>刷新</button>
            </div>
            <textarea aria-label="A/B Prompts" title="A/B Prompts" placeholder="每行一个 Prompt" className="w-full h-28 border rounded p-2 text-sm" value={abPrompts} onChange={e => setAbPrompts(e.target.value)} />
          </div>
          <div className="col-span-1">
            <div className="rounded border p-3 h-full overflow-auto">
              <div className="text-sm text-muted-foreground mb-2">待评审对列</div>
              <div className="space-y-3">
                {abItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无任务</div>
                ) : abItems.map(it => (
                  <div key={it.id} className="rounded border p-2">
                    <div className="text-xs text-muted-foreground mb-2">#{it.id.slice(-6)}</div>
                    <div className="text-sm mb-2">{it.prompt}</div>
                    {(it.output_a || it.output_b) && (
                      <div className="grid grid-cols-1 gap-2 mb-2">
                        <div>
                          <div className="text-xs font-medium text-indigo-600 mb-1">A（{it.model_a}）</div>
                          <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded max-h-40 overflow-auto">{it.output_a || '（无输出）'}</pre>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-pink-600 mb-1">B（{it.model_b}）</div>
                          <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded max-h-40 overflow-auto">{it.output_b || '（无输出）'}</pre>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="px-2 py-1 rounded bg-indigo-500 text-white" onClick={() => vote(it.id, 'A')}>选 A</button>
                      <button className="px-2 py-1 rounded bg-pink-500 text-white" onClick={() => vote(it.id, 'B')}>选 B</button>
                      <button className="px-2 py-1 rounded bg-muted" onClick={() => vote(it.id, 'tie')}>平手</button>
                      <button className="px-2 py-1 rounded bg-muted" onClick={() => vote(it.id, 'skip')}>跳过</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
