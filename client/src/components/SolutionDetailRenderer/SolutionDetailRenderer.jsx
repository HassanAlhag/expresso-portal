import React from "react";
import SolutionFeatureGrid from "../SolutionFeatureGrid/SolutionFeatureGrid";
import SolutionGalleryBlock from "../SolutionGalleryBlock/SolutionGalleryBlock";
import SolutionImageCardsBlock from "../SolutionImageCardsBlock/SolutionImageCardsBlock";
import SolutionImageShowcaseBlock from "../SolutionImageShowcaseBlock/SolutionImageShowcaseBlock";
import SolutionProcessBlock from "../SolutionProcessBlock/SolutionProcessBlock";
import SolutionSplitBlock from "../SolutionSplitBlock/SolutionSplitBlock";
import SolutionUseCasesBlock from "../SolutionUseCasesBlock/SolutionUseCasesBlock";

function normalizeBlock(block = {}) {
  if (block.type === "featureGrid") {
    return {
      ...block,
      items: (block.items || [])
        .map((item) => {
          if (!item || typeof item !== "object") return { title: "", desc: "" };
          return {
            ...item,
            desc: item.desc || item.description || item.content || "",
          };
        })
        .filter((item) => item.title || item.desc),
    };
  }

  if (block.type === "process") {
    return {
      ...block,
      steps: (block.steps || [])
        .map((item, index) => {
          if (!item || typeof item !== "object") {
            return { step: String(index + 1).padStart(2, "0"), title: "", desc: "" };
          }
          return {
            ...item,
            step: item.step || String(index + 1).padStart(2, "0"),
            desc: item.desc || item.description || item.content || "",
          };
        })
        .filter((item) => item.title || item.desc),
    };
  }

  if (block.type === "split") {
    return {
      ...block,
      desc: block.desc || block.description || block.content || "",
      imageUrl: block.imageUrl || block.image || "",
    };
  }

  if (block.type === "useCases") {
    return {
      ...block,
      items: (block.items || []).map((item) => (
        typeof item === "string" ? item : item.title || item.label || item.text || ""
      )).filter(Boolean),
    };
  }

  if (block.type === "imageShowcase") {
    return {
      ...block,
      desc: block.desc || block.description || block.content || "",
      imageUrl: block.imageUrl || block.image || "",
      secondaryImageUrl: block.secondaryImageUrl || block.secondaryImage || "",
      points: (block.points || []).map((item) => (
        typeof item === "string" ? item : item.title || item.label || item.text || ""
      )).filter(Boolean),
    };
  }

  if (block.type === "imageCards" || block.type === "gallery") {
    return {
      ...block,
      items: (block.items || [])
        .map((item) => {
          if (!item || typeof item !== "object") {
            return { title: "", desc: "", imageUrl: "" };
          }
          return {
            ...item,
            desc: item.desc || item.description || item.content || "",
            imageUrl: item.imageUrl || item.image || "",
          };
        })
        .filter((item) => item.title || item.desc || item.imageUrl),
    };
  }

  return block;
}

export default function SolutionDetailRenderer({
  blocks = [],
  accentColor,
  accentBg,
}) {
  return (
    <>
      {blocks.map((block, index) => {
        if (!block || typeof block !== "object") return null;
        const key = `${block.type}-${index}`;
        const normalizedBlock = normalizeBlock(block);

        if (block.type === "featureGrid") {
          return (
            <SolutionFeatureGrid
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "process") {
          return (
            <SolutionProcessBlock
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "split") {
          return (
            <SolutionSplitBlock
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "useCases") {
          return (
            <SolutionUseCasesBlock
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "imageCards") {
          return (
            <SolutionImageCardsBlock
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "imageShowcase") {
          return (
            <SolutionImageShowcaseBlock
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "gallery") {
          return (
            <SolutionGalleryBlock
              key={key}
              {...normalizedBlock}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        return null;
      })}
    </>
  );
}
