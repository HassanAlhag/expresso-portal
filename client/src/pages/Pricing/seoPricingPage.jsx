import React from "react";
import { NeuPricing } from "../../components/ServicesComponents/pricing";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import PricingFeaturesGrid from "../../components/PricingFeatures/pricingFeatures";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import { RiSearchEyeLine, RiBarChartBoxLine } from "react-icons/ri";
import { AiOutlineFundProjectionScreen, AiOutlineLink } from "react-icons/ai";

function SeoPricingPage() {
  const pricingOptions = [
    {
      title: "Basic",
      price: "2000",
      statement: "For individuals and small businesses looking to optimize search rankings.",
      items: [
        { children: "5 Pages SEO Optimization", checked: true },
        { children: "Keyword Research & Implementation", checked: true },
        { children: "Google Search Console & Analytics Setup", checked: true },
        { children: "Technical SEO & Site Speed Optimization", checked: false },
      ],
    },
    {
      title: "Premium",
      price: "3500",
      statement: "For growing businesses looking to improve their online presence.",
      highlight: true,
      items: [
        { children: "10 Pages Full SEO Optimization", checked: true },
        { children: "Advanced Keyword Research & Competitor Analysis", checked: true },
        { children: "Technical SEO Audit & Fixes", checked: true },
        { children: "Backlink Strategy & Off-Page SEO", checked: true },
      ],
    },
    {
      title: "Advanced",
      price: "6000",
      statement: "For enterprises seeking a comprehensive SEO strategy for growth.",
      items: [
        { children: "20+ Pages Full SEO Optimization", checked: true },
        { children: "Technical SEO & Core Web Vitals Optimization", checked: true },
        { children: "Content Marketing & SEO Blog Strategy", checked: true },
        { children: "Advanced Backlink Building & Domain Authority Growth", checked: true },
      ],
    },
  ];

  const seoFeatures = [
    {
      icon: <RiSearchEyeLine size={50} className="text-indigo-500" />,
      title: "Keyword Research & Strategy",
      description:
        "Discover high-ranking keywords tailored to your industry. Our advanced keyword research helps increase organic traffic and conversions.",
    },
    {
      icon: <RiBarChartBoxLine size={50} className="text-indigo-500" />,
      title: "On-Page SEO Optimization",
      description:
        "Enhance your website’s visibility with optimized content, structured headings, meta descriptions, and improved internal linking.",
    },
    {
      icon: <AiOutlineFundProjectionScreen size={50} className="text-indigo-500" />,
      title: "Technical SEO & Performance Fixes",
      description:
        "Boost site speed, mobile usability, and fix crawlability issues. Ensure your website is optimized for search engines and user experience.",
    },
    {
      icon: <AiOutlineLink size={50} className="text-indigo-500" />,
      title: "Backlink Building & Off-Page SEO",
      description:
        "Strengthen your domain authority with high-quality backlinks and off-page SEO strategies that improve search engine credibility.",
    },
  ];

  return (
    <>
      <ServiceBanner
        heading="Get in Touch with SEO Pricing"
        subHeading="We’d love to help you! Whether you need on-page SEO, technical optimizations, or a full-scale strategy, our team offers customized solutions to improve your search rankings."
        backgroundImage="/83.jpeg"
        ctaText="Contact Us"
        ctaLink="/contact-us"
        badgeText="Support Available"
        badgeLink="/support"
        additionalInfo="Our team is available 24/7 to assist you with any inquiries."
      />
      <NeuPricing
        heading="SEO Pricing Plans"
        pricingOptions={pricingOptions}
      />
      <ContactUsSection
        heading="Crafting Success Through SEO"
        content="Unlock the full potential of your website with expert SEO strategies. From keyword research to technical optimizations, we ensure your site ranks higher, drives traffic, and converts visitors into customers."
      />
      <PricingFeaturesGrid features={seoFeatures} />
      <ContactUsSection
        heading="Optimizing SEO for Maximum Impact"
        content="SEO is more than just keywords—it's about delivering the best user experience. We optimize your site's design, speed, and mobile performance to improve engagement and reduce bounce rates."
      />
      <ShiftingContactForm />
    </>
  );
}

export default SeoPricingPage;
