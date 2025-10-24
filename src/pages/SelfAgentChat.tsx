import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { generateChat, chatStream } from "@/services/selfAgent";
import { useAuthStore } from "@/stores/authStore";

type Msg = { role: "user" | "assistant"; content: string };

const contacts = [
  { id: "self", name: "Self Agent" },
  { id: "alice", name: "Alice" },
  { id: "bob", name: "Bob" },
];

export default function SelfAgentChat() {
  const { user } = useAuthStore();
  const [userId, setUserId] = useState<string | undefined>(() => user?.email || user?.id);
  const [target, setTarget] = useState(contacts[0].id);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "你好，我是你的 Self Agent。有什么想聊的？" }]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  useEffect(() => {
    setUserId(user?.email || user?.id);
  }, [user]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!userId) {
      setMsgs((m) => [...m, { role: "assistant", content: "Please login first后再与 Self Agent 对话。" }]);
      return;
    }
    setInput("");
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    setLoading(true);
    try {
      const hint = target !== "self" ? `请模拟与联系人「${target}」的聊天语境and我与Ta的互动风格。` : undefined;
      // 流式优先，失败则回退非流式
      setStreaming(true);
      let acc = "";
      try {
        for await (const chunk of chatStream({ userId, history, useContext: true })) {
          acc += chunk;
          setMsgs((m) => {
            const last = m[m.length - 1];
            if (last?.role === "assistant") {
              // 更新最后一条助手消息
              return [...m.slice(0, -1), { role: "assistant", content: acc }];
            }
            return [...m, { role: "assistant", content: acc }];
          });
        }
      } catch (_) {
        // 回退非流式
        const resp = await generateChat({ userId, history, hint });
        setMsgs((m) => [...m, { role: "assistant", content: resp.text }]);
      } finally {
        setStreaming(false);
      }
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: `出错了：${e?.message || e}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <div className="max-w-screen-md mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Self Agent Chat</h1>
          <select aria-label="对话联系人"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <Card className="p-4 h-[60vh] overflow-y-auto bg-white/80 backdrop-blur-sm border-0">
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
              <div className={m.role === "user" ? "text-right" : "text-left"}>
                <span className={
                  m.role === "user"
                    ? "inline-block px-3 py-2 bg-blue-600 text-white rounded-xl"
                    : "inline-block px-3 py-2 bg-gray-100 text-gray-900 rounded-xl"
                }>
                  {m.content}
                </span>
              </div>
            </motion.div>
          ))}
          <div ref={endRef} />
        </Card>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          />
          <Button onClick={onSend} disabled={loading}>{loading ? (streaming ? "生成中..." : "发送中...") : "发送"}</Button>
        </div>
      </div>
    </div>
  );
}
