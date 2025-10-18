import React from "react";
import { TimelineSection } from "@/services/memories";

export function MemoriesTimeline({ sections }: { sections: TimelineSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((sec) => (
        <section key={sec.date}>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{sec.title}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sec.items.map((it) => (
              <article key={it.id} className="group rounded-xl overflow-hidden bg-white/70 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-3">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <span className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{it.category}</span>
                    <span>·</span>
                    <time>{new Date(it.createdAt).toLocaleTimeString()}</time>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{it.title || '记忆'}</h4>
                  {it.excerpt && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{it.excerpt}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
