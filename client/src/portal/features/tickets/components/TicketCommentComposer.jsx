import React, { useState } from "react";
import Button from "../../../shared/ui/Button";
import { Send, Lock } from "lucide-react";

export default function TicketCommentComposer({ busy, isAdmin, onSubmit }) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    onSubmit?.({ body: text, visibility: internal ? "internal" : "client" });
    setBody("");
    setInternal(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
  };

  return (
    <div className="grid gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Write a reply or update… (⌘↵ to send)"
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        disabled={busy}
      />

      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setInternal((s) => !s)}
            className={[
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition",
              internal
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
            disabled={busy}
          >
            <Lock size={12} />
            {internal ? "Internal note" : "Client-visible"}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">⌘↵ to send</span>
          <Button onClick={submit} disabled={busy || body.trim().length === 0}>
            <Send size={14} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
