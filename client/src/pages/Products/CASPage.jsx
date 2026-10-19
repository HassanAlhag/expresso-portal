import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import CASHero from "./components/CASHero";
import CASBookingJourney from "./components/CASBookingJourney";
import CASProviderScheduling from "./components/CASProviderScheduling";
import CASPlatformSummary from "./components/CASPlatformSummary";
import CASBuiltBy from "./components/CASBuiltBy";
import SolutionImageShowcaseBlock from "../../components/SolutionImageShowcaseBlock/SolutionImageShowcaseBlock";
import SolutionFeatureGrid from "../../components/SolutionFeatureGrid/SolutionFeatureGrid";
import FinalCTASection from "../../components/FinalCTASection/FinalCTASection";
import {
  CAS_PRODUCT,
  CAS_IMAGES,
  CAS_PATIENT_EXPERIENCE,
  CAS_CLINIC_OPERATIONS,
  CAS_BENEFITS,
  CAS_FINAL_CTA,
} from "../../data/casProduct";

const ACCENT = "#8390C8";
const ACCENT_BG = "rgba(131,144,200,0.10)";

export default function CASPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>CAS — Clinic Appointment System | Expresso Digital</title>
        <meta
          name="description"
          content="CAS is a clinic appointment system designed and developed by Expresso Digital, connecting patient appointment booking with clinic-side doctor and schedule management."
        />
      </Helmet>

      <CASHero />

      <SolutionImageShowcaseBlock
        eyebrow={CAS_PATIENT_EXPERIENCE.eyebrow}
        title={`${CAS_PATIENT_EXPERIENCE.title} ${CAS_PATIENT_EXPERIENCE.highlight}`}
        desc={CAS_PATIENT_EXPERIENCE.subtitle}
        imageUrl={CAS_IMAGES.doctorsDesktop.src}
        imageAlt={CAS_IMAGES.doctorsDesktop.alt}
        points={CAS_PATIENT_EXPERIENCE.points}
        accentColor={ACCENT}
        accentBg={ACCENT_BG}
      />

      <CASBookingJourney />

      <div className="bg-neutral-50">
        <SolutionImageShowcaseBlock
          eyebrow={CAS_CLINIC_OPERATIONS.eyebrow}
          title={`${CAS_CLINIC_OPERATIONS.title} ${CAS_CLINIC_OPERATIONS.highlight}`}
          desc={CAS_CLINIC_OPERATIONS.subtitle}
          imageUrl={CAS_IMAGES.adminAppointments.src}
          imageAlt={CAS_IMAGES.adminAppointments.alt}
          points={CAS_CLINIC_OPERATIONS.points}
          accentColor={ACCENT}
          accentBg={ACCENT_BG}
        />
      </div>

      <CASProviderScheduling />

      <div className="bg-neutral-50">
        <CASPlatformSummary />
      </div>

      <SolutionFeatureGrid
        eyebrow={CAS_BENEFITS.eyebrow}
        title={CAS_BENEFITS.title}
        highlight={CAS_BENEFITS.highlight}
        items={CAS_BENEFITS.items.map((item) => ({
          title: item.title,
          desc: item.desc,
        }))}
        accentColor={ACCENT}
        accentBg={ACCENT_BG}
        columns={2}
      />

      <div className="bg-neutral-50">
        <CASBuiltBy />
      </div>

      <FinalCTASection
        onPrimaryClick={() => navigate(CAS_PRODUCT.demoHref)}
        badge={CAS_FINAL_CTA.badge}
        heading={CAS_FINAL_CTA.heading}
        headingHighlight={CAS_FINAL_CTA.headingHighlight}
        description={CAS_FINAL_CTA.description}
        primaryLabel={CAS_FINAL_CTA.primaryLabel}
        secondaryLabel={CAS_FINAL_CTA.secondaryLabel}
        secondaryLink={CAS_PRODUCT.contactHref}
      />
    </>
  );
}
