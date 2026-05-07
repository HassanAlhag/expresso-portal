import React, { useMemo, useState } from "react";
import { FiMaximize2, FiX, FiExternalLink } from "react-icons/fi";

const BRAND = "#7F8AD1";

export default function CreativePostsShowcase({
  title = "Creative posts that look premium",
  subtitle = "Static creatives & carousels designed with clear hierarchy, brand consistency, and strong CTAs.",
  posts = [],
  ctaText = "Request creatives like these",
  onCtaClick,
}) {
  const [active, setActive] = useState(null);
  const safePosts = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);

  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="mx-auto w-[min(1200px,92vw)]">
        {/* Header */}
        <div className="mb-8 md:mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">
              CREATIVE POSTS
            </p>
            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950">
              {title.split(" ").slice(0, 3).join(" ")}{" "}
              <span style={{ color: BRAND }}>
                {title.split(" ").slice(3).join(" ")}
              </span>
            </h2>
          </div>

          <p className="max-w-md text-sm md:text-base text-neutral-600">
            {subtitle}
          </p>
        </div>

        {/* Masonry-like grid (simple, clean) */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
          {safePosts.map((p) => (
            <PostCard key={p.id} post={p} onOpen={() => setActive(p)} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white px-5 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-neutral-700">
            Need a full monthly content pack?{" "}
            <span className="font-semibold text-neutral-900">
              We can deliver branded templates + variations.
            </span>
          </p>
          <button
            type="button"
            onClick={onCtaClick}
            className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition"
          >
            {ctaText} →
          </button>
        </div>
      </div>

      {/* Modal */}
      {active ? (
        <div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-[980px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {active.title}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {active.client ? `${active.client} • ` : ""}
                  {active.platform || "Creative"}{" "}
                  {active.format ? `• ${active.format}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {active.link ? (
                  <a
                    href={active.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 transition"
                  >
                    Open link <FiExternalLink />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-neutral-900 hover:bg-neutral-100 transition"
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="bg-black">
              <div className="relative w-full">
                <img
                  src={active.src}
                  alt={active.title}
                  className="w-full max-h-[78vh] object-contain bg-black"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PostCard({ post, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "group mb-6 w-full break-inside-avoid",
        "overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        "shadow-[0_10px_35px_rgba(0,0,0,0.08)]",
        "transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(0,0,0,0.14)]",
        "text-left",
      ].join(" ")}
    >
      <div className="relative overflow-hidden bg-neutral-100">
        <img
          src={post.src}
          alt={post.title}
          className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          draggable={false}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition" />

        {/* Zoom icon */}
        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-900 shadow">
            <FiMaximize2 />
            View
          </div>
        </div>

        {/* bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition">
          <p className="text-xs text-white/80">
            {post.client || post.category || "Creative"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white line-clamp-1">
            {post.title}
          </p>
        </div>
      </div>

      {/* bottom bar always visible */}
      <div className="px-5 py-4">
        <p className="text-sm font-semibold text-neutral-900 line-clamp-1">
          {post.title}
        </p>
        <p className="mt-1 text-xs text-neutral-500 line-clamp-1">
          {post.platform || "Instagram"} {post.format ? `• ${post.format}` : ""}{" "}
          {post.category ? `• ${post.category}` : ""}
        </p>
      </div>
    </button>
  );
}
