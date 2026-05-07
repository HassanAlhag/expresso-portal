import React, { useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { createActivity } from "../api";
import {
  Phone, Mail, Users, StickyNote, CheckSquare,
  MessageCircle, MoreHorizontal, Send,
} from "lucide-react";

const TYPES = [
  { value: "call",     label: "Call",     Icon: Phone },
  { value: "email",    label: "Email",    Icon: Mail },
  { value: "meeting",  label: "Meeting",  Icon: Users },
  { value: "note",     label: "Note",     Icon: StickyNote },
  { value: "task",     label: "Task",     Icon: CheckSquare },
  { value: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { value: "other",    label: "Other",    Icon: MoreHorizontal },
];

export default function CRMActivityComposer({ entityType, entityId, onCreated }) {
  const [type, setType] = useState("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setSubject("");
    setBody("");
    setOutcome("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Subject is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const item = await createActivity({
        type,
        subject: subject.trim(),
        body: body.trim(),
        outcome: outcome.trim(),
        entityType,
        entityId,
        status: "done",
      });
      reset();
      onCreated?.(item?.item || item);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to log activity.");
    } finally {
      setBusy(false);
    }
  };

  const selected = TYPES.find((t) => t.value === type);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition",
              type === value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
            ].join(" ")}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <Input
        label={`${selected?.label || "Activity"} subject`}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={
          type === "call" ? "Call with client about proposal..." :
          type === "email" ? "Sent follow-up email..." :
          type === "meeting" ? "Discovery meeting at office..." :
          type === "note" ? "Noted: client prefers WhatsApp..." :
          type === "task" ? "Follow up by end of week..." :
          type === "whatsapp" ? "Shared pricing deck on WhatsApp..." :
          "Activity subject..."
        }
      />

      <div className="grid gap-2">
        <label className="text-[11px] font-black tracking-[0.18em] text-slate-500">
          DETAILS (optional)
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Additional context, key points discussed..."
          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-black/5 placeholder:text-slate-400"
        />
      </div>

      {(type === "call" || type === "meeting") && (
        <Input
          label="OUTCOME"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          placeholder="e.g. Agreed to send proposal by Thursday"
        />
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={busy} disabled={!subject.trim()}>
          <Send size={14} />
          Log {selected?.label || "activity"}
        </Button>
      </div>
    </form>
  );
}
