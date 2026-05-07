import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

import { PortfolioTab, TAB_DATA } from "./portfolioTabs";
import MagnetButtonExample from "./viewButton";
import portfolioData from "../../pages/SingleViewPortfolio/portfolioData";

import ReelsShowcase from "../../components/ReelsShowcase/ReelsShowcase";
import CreativePostsShowcase from "../../components/CreativePostsShowcase/CreativePostsShowcase";

const BRAND = "#7F8AD1";

export default function PortfolioGrid() {
  const [selectedTab, setSelectedTab] = useState(1);

  const scrollToLeadForm = () => {
    document
      .getElementById("lead-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedTitle = useMemo(() => {
    return TAB_DATA.find((t) => t.id === selectedTab)?.title || "All";
  }, [selectedTab]);

  const filteredPortfolios = useMemo(() => {
    if (selectedTab === 1) return portfolioData;
    const needle = selectedTitle.toLowerCase().trim();
    return portfolioData.filter((item) =>
      (item.category || "").toLowerCase().includes(needle)
    );
  }, [selectedTab, selectedTitle]);

  // Demo data (replace later)
  const reels = [
    {
      id: "r1",
      title: "PPC Offer Reel – Hook + CTA",
      platform: "Instagram",
      category: "Ads",
      client: "Odeur",
      duration: "0:18",
      poster: "/reels/posters/reel1.jpg",
      src: "/reels/videos/reel1.mp4",
    },
  ];

  const posts = [
    {
      id: "p1",
      title: "Launch Creative – Premium Offer",
      platform: "Instagram",
      format: "Post",
      category: "Branding",
      client: "M-Region",
      src: "/creatives/posts/post1.jpg",
      link: "https://www.instagram.com/",
    },
  ];

  useEffect(() => {
    // optional
  }, [selectedTab]);

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-10 md:py-14">
      {/* Tabs */}
      <div className="mb-4 md:mb-2">
        <PortfolioTab selected={selectedTab} setSelected={setSelectedTab} />
      </div>

      {/* Featured strip */}
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-neutral-700">
          Showing:{" "}
          <span className="font-semibold text-neutral-900">
            {selectedTitle}
          </span>{" "}
          • {filteredPortfolios.length} projects
        </p>

        <a
          href="/contact-us"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition"
        >
          Request a similar project →
        </a>
      </div>

      {/* Portfolio Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPortfolios.map((portfolio) => (
          <ImageCard key={portfolio.id} portfolio={portfolio} />
        ))}
      </div>

      {/* Divider */}
      <div className="my-12 h-px w-full bg-neutral-200" />

      {/* Reels */}
      <ReelsShowcase reels={reels} onCtaClick={scrollToLeadForm} />

      {/* Creative Posts */}
      <CreativePostsShowcase posts={posts} onCtaClick={scrollToLeadForm} />
    </section>
  );
}

function ImageCard({ portfolio }) {
  const navigate = useNavigate();
  const go = () => navigate(`/portfolio/detail/${portfolio.id}`);

  return (
    <button
      type="button"
      onClick={go}
      className={[
        "group relative text-left",
        "overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        "shadow-[0_10px_35px_rgba(0,0,0,0.08)]",
        "transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(0,0,0,0.14)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
      ].join(" ")}
      aria-label={`Open portfolio ${portfolio.clientName}`}
    >
      {/* Media */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <LazyLoadImage
          src={portfolio.thumbnailImg}
          alt={portfolio.clientName}
          effect="blur"
          wrapperClassName="w-full h-full"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* Overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>

        {/* Category pill */}
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/90 px-3 py-1 text-[12px] font-semibold text-neutral-900 shadow-sm backdrop-blur">
            {portfolio.category}
          </span>
        </div>

        {/* Hover info */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
          <div className="translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <h3 className="text-lg font-semibold text-white">
              {portfolio.clientName}
            </h3>
            <p className="mt-1 text-sm text-white/85 line-clamp-1">
              View project details & deliverables
            </p>
          </div>
        </div>

        {/* Center CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="pointer-events-auto">
            <MagnetButtonExample />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {portfolio.clientName}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {portfolio.category}
          </p>
        </div>

        <span
          className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition"
          style={{
            borderColor: "rgba(127,138,209,0.25)",
            background: "rgba(127,138,209,0.10)",
            color: BRAND,
          }}
        >
          View
        </span>
      </div>
    </button>
  );
}
