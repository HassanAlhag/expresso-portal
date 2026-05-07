import React, { useState } from "react";
import { useToast } from "../../../shared/ui/Toast";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import { ImagePlus } from "lucide-react";
import ProductionForm from "../components/ProductionForm";
import AttachMediaModal from "../components/AttachMediaModal";

import { getAssetUrl } from "../../../shared/utils/assetUrl";

export default function ProductionBuilderPage() {
  const toast = useToast();
  const [form, setForm] = useState({
    title: "",
    customerName: "",
    status: "draft",
    notes: "",
    assets: [],
  });

  const [attachOpen, setAttachOpen] = useState(false);

  const save = async () => {
    console.log("save production", form);
    toast.info("Production save endpoint not connected yet.");
  };

  return (
    <div className="grid gap-5">
      <div>
        <div className="text-[11px] font-extrabold tracking-[0.22em] text-slate-500">
          CONTENT / PRODUCTION
        </div>
        <div className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          Production Builder
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Create a production and attach media assets.
        </div>
      </div>

      <Card className="p-5">
        <ProductionForm
          value={form}
          onChange={setForm}
          onSubmit={save}
          onOpenMedia={() => setAttachOpen(true)}
        />
      </Card>

      <Card className="p-5">
        {form.assets?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {form.assets.map((m) => (
              <div
                key={m._id}
                className="overflow-hidden rounded-[20px] border border-black/10 bg-white"
              >
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  {m.type === "image" ? (
                    <img
                      src={getAssetUrl(m.thumbnailUrl || m.url)}
                      alt={m.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-extrabold text-slate-600">
                      {m.type}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-black text-slate-900">
                    {m.title || "Untitled"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ImagePlus}
            title="No media attached"
            message="Attach files from the media library to build this production."
            actionLabel="Attach media"
            onAction={() => setAttachOpen(true)}
          />
        )}
      </Card>

      <AttachMediaModal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        multiple
        status=""
        title="Attach media"
        onAttach={(items) => {
          const selected = Array.isArray(items) ? items : [items];

          setForm((prev) => ({
            ...prev,
            assets: [...(prev.assets || []), ...selected.filter(Boolean)],
          }));

          setAttachOpen(false);
        }}
      />
    </div>
  );
}
