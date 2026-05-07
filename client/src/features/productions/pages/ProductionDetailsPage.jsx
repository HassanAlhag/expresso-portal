import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductionBySlug } from "../api";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ProductionDetailsPage() {
  const nav = useNavigate();
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [item, setItem] = useState(null);

  // lightbox
  const [lb, setLb] = useState({ open: false, index: 0 });

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getProductionBySlug(slug);
      setItem(res?.item || null);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e?.message || "Failed to load production"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [slug]);

  const images = useMemo(() => {
    const g = item?.gallery || [];
    // show images + other media as cards (lightbox only for images)
    return g;
  }, [item]);

  const lbImagesOnly = useMemo(
    () => images.filter((m) => m.type === "image"),
    [images]
  );

  const openLb = (mediaId) => {
    const idx = lbImagesOnly.findIndex((x) => x._id === mediaId);
    if (idx >= 0) setLb({ open: true, index: idx });
  };

  const next = () =>
    setLb((s) => ({
      ...s,
      index: (s.index + 1) % Math.max(1, lbImagesOnly.length),
    }));
  const prev = () =>
    setLb((s) => ({
      ...s,
      index:
        (s.index - 1 + lbImagesOnly.length) % Math.max(1, lbImagesOnly.length),
    }));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="h-10 w-40 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="mt-6 h-10 w-2/3 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-black/10 bg-slate-50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-extrabold text-red-700">
          {err}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">
          Production not found.
        </div>
      </div>
    );
  }

  const cover = item.coverMedia?.url;

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <button
        type="button"
        onClick={() => nav("/productions")}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900 hover:bg-black/[0.03] transition"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {item.title}
          </h1>
          <p className="mt-3 text-slate-600">{item.excerpt || ""}</p>

          {item.description ? (
            <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 text-sm text-slate-700 whitespace-pre-wrap">
              {item.description}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {(item.tags || []).map((t) => (
              <span
                key={t}
                className="text-[11px] font-extrabold px-3 py-1 rounded-full border border-black/10 bg-slate-50 text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
            <div className="aspect-[4/3] bg-slate-50">
              {cover ? (
                item.coverMedia?.type === "video" ? (
                  <video
                    src={cover}
                    poster={item.coverMedia.thumbnailUrl || undefined}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={cover}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <div className="h-full grid place-items-center text-xs font-extrabold text-slate-600">
                  NO COVER
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-10">
        <div className="text-sm font-extrabold text-slate-900">Gallery</div>

        {images.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-black/10 bg-white p-6 text-sm font-extrabold text-slate-700">
            No media attached yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => {
                  if (m.type === "image") openLb(m._id);
                  else if (m.type !== "video") window.open(m.url, "_blank");
                }}
                className="text-left rounded-2xl border border-black/10 bg-white overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                  {m.type === "image" ? (
                    <img
                      src={m.thumbnailUrl || m.url}
                      alt={m.title}
                      className="h-full w-full object-cover"
                    />
                  ) : m.type === "video" ? (
                    <video
                      src={m.url}
                      poster={m.thumbnailUrl || undefined}
                      controls
                      className="h-full w-full object-cover"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-xs font-extrabold text-slate-600">
                      {m.type.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-extrabold text-slate-900">
                    {m.title || "Untitled"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox (images only) */}
      {lb.open && lbImagesOnly[lb.index] ? (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={() => setLb({ open: false, index: 0 })}
        >
          <div
            className="relative w-[min(1100px,96vw)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between text-white">
              <div className="min-w-0">
                <div className="text-sm text-white/70 truncate">
                  {item.title}
                </div>
                <div className="text-lg font-semibold truncate">
                  {lbImagesOnly[lb.index].title}
                </div>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
                onClick={() => setLb({ open: false, index: 0 })}
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
              <img
                src={lbImagesOnly[lb.index].url}
                alt={lbImagesOnly[lb.index].title}
                className="w-full max-h-[78vh] object-contain bg-black"
                draggable={false}
              />

              {lbImagesOnly.length > 1 ? (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition"
                  >
                    <ChevronRight />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
