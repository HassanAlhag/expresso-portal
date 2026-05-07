import React from "react";
import { Lock, Activity } from "lucide-react";

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function EventEntry({ comment }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
        <Activity size={12} className="text-slate-400" />
      </div>
      <div className="flex-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{comment.body}</span>
        <span className="ml-2">{fmt(comment.createdAt)}</span>
      </div>
    </div>
  );
}

function CommentEntry({ comment, isAdmin }) {
  const internal = comment.visibility === "internal";
  const isAdminAuthor = comment.authorRole === "admin";

  return (
    <div className={["rounded-xl border p-4", internal ? "border-amber-200 bg-amber-50" : isAdminAuthor ? "border-indigo-100 bg-indigo-50/50" : "border-slate-200 bg-white"].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
                isAdminAuthor ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {isAdminAuthor ? "Team" : "Client"}
            </div>
            <span className="text-xs text-slate-400">{fmt(comment.createdAt)}</span>
          </div>
          <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {comment.body}
          </p>
        </div>

        {internal && isAdmin && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
            <Lock size={11} />
            Internal
          </span>
        )}
      </div>
    </div>
  );
}

export default function TicketThread({ comments = [], isAdmin }) {
  if (!comments.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
        No messages yet — be the first to add an update.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) =>
        c.event ? (
          <EventEntry key={c._id || c.createdAt} comment={c} />
        ) : (
          <CommentEntry key={c._id || c.createdAt} comment={c} isAdmin={isAdmin} />
        )
      )}
    </div>
  );
}
