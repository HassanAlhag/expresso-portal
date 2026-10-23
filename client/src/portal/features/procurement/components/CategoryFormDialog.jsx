import React, { useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, X } from "lucide-react";
import FormDialog from "../../../shared/ui/FormDialog";
import TextField from "../../../shared/ui/TextField";
import SelectField from "../../../shared/ui/SelectField";
import Button from "../../../shared/ui/Button";
import MediaPickerModal from "../../media-library/components/MediaPickerModal";
import { getAssetUrl } from "../../../shared/utils/assetUrl";

// The icon keys the public site renders for a category.
export const CATEGORY_ICONS = [
  { value: "software", label: "Software licensing" },
  { value: "erp", label: "ERP solution" },
  { value: "crm", label: "CRM solution" },
  { value: "queue", label: "Queue management" },
  { value: "iot", label: "IoT solutions" },
  { value: "vas", label: "VAS solutions" },
  { value: "cloud", label: "Cloud services" },
  { value: "hosting", label: "Web hosting and domains" },
  { value: "datacenter", label: "Data center" },
  { value: "consultation", label: "IT consultation" },
  { value: "networking", label: "Networking hardware" },
  { value: "hardware", label: "Data center hardware" },
];
const BLANK = { name: "", subtitle: "", description: "", icon: "software", order: "", isActive: "true", heroImageUrl: "", heroImageMediaId: null };

// Category form (PUI-4): the same fields as before, including the hero
// image chosen from the media library.
export default function CategoryFormDialog({ open, initial, busy, error, onClose, onSubmit }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(BLANK);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPicker(false);
    setForm(
      initial
        ? {
            name: initial.name || "",
            subtitle: initial.subtitle || "",
            description: initial.description || "",
            icon: initial.icon || "software",
            order: initial.order ?? "",
            isActive: String(initial.isActive !== false),
            heroImageUrl: initial.heroImageUrl || "",
            heroImageMediaId: initial.heroImageMediaId || null,
          }
        : BLANK
    );
  }, [open, initial]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));
  const iconOptions = CATEGORY_ICONS.some((o) => o.value === form.icon) ? CATEGORY_ICONS : [...CATEGORY_ICONS, { value: form.icon, label: form.icon || "None" }];

  return (
    <>
      <FormDialog
        open={open}
        title={isEdit ? "Edit category" : "New category"}
        description="Categories group requests, match RFQs to vendors and appear on the public site."
        onClose={onClose}
        onSubmit={() => onSubmit?.({ ...form, name: form.name.trim(), order: form.order !== "" ? Number(form.order) : undefined, isActive: form.isActive === "true" })}
        busy={busy}
        error={error}
        canSubmit={Boolean(form.name.trim())}
        submitLabel={isEdit ? "Save changes" : "Create category"}
        submitIcon={isEdit ? Pencil : Plus}
      >
        <fieldset className="px-form-section">
          <legend>Category</legend>
          <TextField label="Name" required value={form.name} onChange={set("name")} />
          <TextField label="Subtitle" value={form.subtitle} onChange={set("subtitle")} placeholder="Short tagline" />
          <TextField label="Description" multiline rows={3} value={form.description} onChange={set("description")} />
          <div className="px-form-grid px-form-grid--3">
            <SelectField label="Icon" value={form.icon} onChange={set("icon")} options={iconOptions} />
            <TextField label="Display order" type="number" value={String(form.order)} onChange={set("order")} />
            <SelectField label="Status" value={form.isActive} onChange={set("isActive")} options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
          </div>
        </fieldset>
        <fieldset className="px-form-section">
          <legend>Hero image</legend>
          {form.heroImageUrl ? (
            <div style={{ display: "grid", gap: 8 }}>
              <img src={getAssetUrl(form.heroImageUrl)} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10 }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button size="sm" variant="outline" onClick={() => setPicker(true)}><ImagePlus size={14} aria-hidden="true" />Replace</Button>
                <Button size="sm" variant="ghost" onClick={() => setForm((f) => ({ ...f, heroImageUrl: "", heroImageMediaId: null }))}><X size={14} aria-hidden="true" />Remove</Button>
              </div>
            </div>
          ) : (
            <div>
              <Button size="sm" variant="outline" onClick={() => setPicker(true)}><ImagePlus size={14} aria-hidden="true" />Choose from the media library</Button>
            </div>
          )}
        </fieldset>
      </FormDialog>
      {open ? (
        <MediaPickerModal
          open={picker}
          onClose={() => setPicker(false)}
          onSelect={(asset) => {
            setForm((f) => ({ ...f, heroImageUrl: asset?.url || asset?.path || "", heroImageMediaId: asset?._id || asset?.id || null }));
            setPicker(false);
          }}
        />
      ) : null}
    </>
  );
}
