import React from "react";
import PlanBuilder from "../../components/PlanBuilder/PlanBuilder";
import AuroraHero from "../../components/BannerSection/bannerSection";

export default function PlanBuilderPage() {
  return (
    <div className="bg-white">
      <AuroraHero
        heading="Who We Are"
        subtitle="Turning Ideas Into Digital Impact"
        description="At Expresso Digital, we don’t just market brands — we engineer digital growth. From strategy to storytelling, performance to platforms, we build campaigns that capture attention, convert audiences, and create momentum."
      />
      <PlanBuilder
        onFinish={(payload) => {
          console.log("PlanBuilder Payload:", payload);
          // later you can send this to email/CRM/backend
        }}
      />
    </div>
  );
}
