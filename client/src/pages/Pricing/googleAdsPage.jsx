import React from "react";
import { NeuPricing } from "../../components/ServicesComponents/pricing";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import PricingFeaturesGrid from "../../components/PricingFeatures/pricingFeatures";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import { RiAdvertisementFill, RiMoneyDollarCircleFill } from "react-icons/ri";
import { FaChartLine, FaUserCheck } from "react-icons/fa";

function GoogleAdsPricingPage() {
  const pricingOptions = [
    {
      title: "Basic",
      price: "2000",
      statement: "For small businesses looking to start with Google Ads.",
      items: [
        { children: "Google Ads Account Setup", checked: true },
        { children: "Campaign Setup & Management", checked: true },
        { children: "Keyword Research & Targeting", checked: true },
        { children: "Conversion Tracking & Optimization", checked: false },
      ],
    },
    {
      title: "Premium",
      price: "3500",
      statement: "For businesses aiming to scale their advertising reach.",
      highlight: true,
      items: [
        { children: "Advanced Google Ads Strategy", checked: true },
        { children: "Conversion Tracking & A/B Testing", checked: true },
        { children: "Display & Remarketing Campaigns", checked: true },
        { children: "Monthly Performance Reports", checked: true },
      ],
    },
    {
      title: "Advanced",
      price: "6000",
      statement: "For enterprises requiring comprehensive Google Ads management.",
      items: [
        { children: "Full Google Ads Management", checked: true },
        { children: "Google Shopping & Performance Max Ads", checked: true },
        { children: "Advanced Audience Targeting", checked: true },
        { children: "Dedicated Account Manager", checked: true },
      ],
    },
  ];

  const googleAdsFeatures = [
    {
      icon: <RiAdvertisementFill size={50} className="text-indigo-500" />,
      title: "Campaign Setup & Optimization",
      description:
        "We create and manage high-performing Google Ads campaigns tailored to your business goals, maximizing conversions while reducing costs.",
    },
    {
      icon: <RiMoneyDollarCircleFill size={50} className="text-indigo-500" />,
      title: "Budget & Bidding Strategy",
      description:
        "Optimize your ad spend with strategic bidding techniques, ensuring the best ROI while maximizing visibility and conversions.",
    },
    {
      icon: <FaChartLine size={50} className="text-indigo-500" />,
      title: "Performance Tracking & Reports",
      description:
        "Get detailed analytics and performance insights to track ROI, identify trends, and refine your ad strategies for continuous improvement.",
    },
    {
      icon: <FaUserCheck size={50} className="text-indigo-500" />,
      title: "Audience Targeting & Retargeting",
      description:
        "Target the right audience with precision using advanced demographic, interest, and remarketing strategies for better ad engagement.",
    },
  ];

  return (
    <>
      <ServiceBanner
        heading="Get in Touch with Google Ads Pricing"
        subHeading="We’d love to help you! Whether you need campaign setup, advanced targeting, or full-scale Google Ads management, our team provides tailored solutions to maximize your advertising ROI."
        backgroundImage="/84.jpg"
        ctaText="Contact Us"
        ctaLink="/contact-us"
        badgeText="Support Available"
        badgeLink="/support"
        additionalInfo="Our team is available 24/7 to assist you with any inquiries."
      />
      <NeuPricing
        heading="Google Ads Pricing Plans"
        pricingOptions={pricingOptions}
      />
      <ContactUsSection
        heading="Maximize ROI with Google Ads"
        content="Unlock the full potential of Google Ads with expert campaign management. From keyword research to budget optimization, our strategies are designed to increase visibility, drive traffic, and generate conversions."
      />
      <PricingFeaturesGrid features={googleAdsFeatures} />
      <ContactUsSection
        heading="Performance-Driven Advertising"
        content="Our approach goes beyond just running ads. We focus on data-driven optimization, audience segmentation, and continuous improvement to ensure your business achieves the best return on investment."
      />
      <ShiftingContactForm />
    </>
  );
}

export default GoogleAdsPricingPage;
