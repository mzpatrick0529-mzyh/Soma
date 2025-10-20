import React, { useState } from "react";
import { TimelineSection } from "@/services/memories";
import { MemoryDetailModal } from "./MemoryDetailModal";

interface MemoriesTimelineProps {
  sections: TimelineSection[];
  userId: string;
}

export function MemoriesTimeline({ sections, userId }: MemoriesTimelineProps) {
  const [selectedChunkId, setSelectedChunkId] = useState<string | undefined>();
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>();

  const handleItemClick = (item: any) => {
    if (item.id) {
      setSelectedChunkId(item.id);
      setSelectedDocId(item.docId);
    }
  };

  const handleClose = () => {
    setSelectedChunkId(undefined);
    setSelectedDocId(undefined);
  };

  return (
    <>
      <div className="space-y-8">
        {sections.map((sec) => (
          <section key={sec.date}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{sec.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sec.items.map((it) => (
                <article 
                  key={it.id} 
                  onClick={() => handleItemClick(it)}
                  className="group rounded-xl overflow-hidden bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                >
                  <div className="p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <span className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">{it.category}</span>
                      <span>·</span>
                      <time>{new Date(it.createdAt).toLocaleTimeString()}</time>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {it.title || '记忆'}
                    </h4>
                    {it.excerpt && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{it.excerpt}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {(selectedChunkId || selectedDocId) && (
        <MemoryDetailModal
          chunkId={selectedChunkId}
          docId={selectedDocId}
          userId={userId}
          onClose={handleClose}
        />
      )}
    </>
  );
}
