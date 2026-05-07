import React from "react";
import SolutionFeatureGrid from "../SolutionFeatureGrid/SolutionFeatureGrid";
import SolutionProcessBlock from "../SolutionProcessBlock/SolutionProcessBlock";
import SolutionSplitBlock from "../SolutionSplitBlock/SolutionSplitBlock";
import SolutionUseCasesBlock from "../SolutionUseCasesBlock/SolutionUseCasesBlock";

export default function SolutionDetailRenderer({
  blocks = [],
  accentColor,
  accentBg,
}) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "featureGrid") {
          return (
            <SolutionFeatureGrid
              key={key}
              {...block}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "process") {
          return (
            <SolutionProcessBlock
              key={key}
              {...block}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "split") {
          return (
            <SolutionSplitBlock
              key={key}
              {...block}
              accentColor={accentColor}
              accentBg={accentBg}
            />
          );
        }

        if (block.type === "useCases") {
          return (
            <SolutionUseCasesBlock
              key={key}
              {...block}
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
