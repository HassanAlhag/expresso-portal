import React, { useCallback, useEffect, useState } from "react";
import { Image as ImageIcon, Plus, RefreshCw } from "lucide-react";

import PageHeader from "../../../shared/ui/PageHeader";
import Button from "../../../shared/ui/Button";
import Skeleton from "../../../shared/ui/Skeleton";
import EmptyState from "../../../shared/ui/EmptyState";
import Card from "../../../shared/ui/Card";
import { useToast } from "../../../shared/ui/Toast";
import ConfirmModal from "../../../shared/ui/ConfirmModal";

import HomepageSlideFormModal from "../components/HomepageSlideFormModal";
import HomepageSlideList from "../components/HomepageSlideList";

import { listSlides, createSlide, updateSlide, deleteSlide } from "../api";

export default function HomepageSlidersPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmState, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await listSlides();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e?.message || "Failed to load slides"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const handleEdit = (slide) => {
    setSelected(slide);
    setModalOpen(true);
  };

  const handleSave = async (form) => {
    setBusy(true);

    try {
      if (selected?._id) {
        await updateSlide(selected._id, form);
      } else {
        await createSlide(form);
      }

      setModalOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (slide) => {
    setConfirm({
      title: "Delete slide",
      message: `Delete slide "${slide.title || "this slide"}"?`,
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        setConfirm(null);
        try {
          await deleteSlide(slide._id);
          await load();
        } catch (e) {
          toast.error(e?.response?.data?.message || e?.message || "Delete failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleToggle = async (slide) => {
    setBusy(true);

    try {
      await updateSlide(slide._id, {
        isActive: !slide.isActive,
      });

      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="WEBSITE"
          title="Homepage Slides"
          subtitle="Manage the hero slider shown on the public homepage."
          breadcrumb={[
            { label: "Portal", to: "/portal" },
            { label: "Website" },
            { label: "Homepage Slides" },
          ]}
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={load}
                disabled={loading || busy}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </Button>

              <Button onClick={handleCreate} disabled={busy}>
                <Plus size={16} />
                New slide
              </Button>
            </div>
          }
        />

        {loading ? (
          <Card className="p-6">
            <div className="grid gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No slides yet"
            message="Create your first homepage hero slide."
            actionLabel="New slide"
            onAction={handleCreate}
          />
        ) : (
          <HomepageSlideList
            items={items}
            busy={busy}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}
      </div>

      <HomepageSlideFormModal
        open={modalOpen}
        initial={selected}
        busy={busy}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSubmit={handleSave}
      />
      <ConfirmModal
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        danger={confirmState?.danger}
        onConfirm={confirmState?.onConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
