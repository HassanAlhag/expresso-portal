import React, { useEffect, useMemo, useState } from "react";
import RightDrawer from "../../../../shared/ui/RightDrawer";
import Button from "../../../../shared/ui/Button";
import Input from "../../../../shared/ui/Input";

export default function ResetPasswordModal({
  open,
  user,
  onClose,
  onSubmit, // (newPassword) => Promise | void
  busy,
}) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setP1("");
    setP2("");
    setError("");
    setSaving(false);
  }, [open]);

  const canSave = useMemo(() => {
    if (!p1 || p1.length < 8) return false;
    if (p1 !== p2) return false;
    return true;
  }, [p1, p2]);

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      await onSubmit?.(p1);
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="Reset password"
      subtitle={user?.email || "User"}
    >
      <div className="grid gap-4">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-extrabold text-rose-700">
            {error}
          </div>
        ) : null}

        <Input
          label="New password"
          type="password"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          placeholder="Min 8 characters"
          error={p1 && p1.length < 8 ? "Min 8 characters" : ""}
        />

        <Input
          label="Confirm password"
          type="password"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          placeholder="Repeat new password"
          error={p2 && p1 !== p2 ? "Passwords do not match" : ""}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving || busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || saving || busy}>
            {saving ? "Saving…" : "Reset password"}
          </Button>
        </div>
      </div>
    </RightDrawer>
  );
}
