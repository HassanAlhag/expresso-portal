import React, { useEffect, useState } from "react";
import { useToast } from "../../../../shared/ui/Toast";
import Button from "../../../../shared/ui/Button";
import Card from "../../../../shared/ui/Card";
import { updateUser } from "../api";

export default function NotesTab({ user }) {
  const toast = useToast();
  const [text, setText] = useState(user?.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setText(user?.notes || "");
    setSaved("");
  }, [user]);

  const save = async () => {
    if (!user?._id) return;

    setSaving(true);
    setSaved("");
    try {
      await updateUser(user._id, { notes: text });
      setSaved("Saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="p-5">
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
          INTERNAL NOTES
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Admin-only notes for this user profile.
        </div>

        <div className="mt-4 grid gap-3">
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write internal notes about this user..."
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:ring-4 focus:ring-black/5"
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">{saved || " "}</div>

            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
