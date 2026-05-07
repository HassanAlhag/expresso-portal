import React from "react";
import { NeuPricing } from "../../components/ServicesComponents/pricing";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import PricingFeaturesGrid from "../../components/PricingFeatures/pricingFeatures";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import { CiMobile1 } from "react-icons/ci";
import { RiSeoLine } from "react-icons/ri";
import { SiFsecure } from "react-icons/si";
import { BiCustomize } from "react-icons/bi";

function WebPricingPage() {
  const pricingOptions = [
    {
      title: "Basic",
      price: "2000",
      statement: "For individuals looking to up their productivity gains.",
      items: [
        { children: "5 Pages Content", checked: true },
        { children: "Responsive Design", checked: true },
        { children: "Basic SEO Setup", checked: true },
        { children: "E-commerce Functionality", checked: false },
      ],
    },
    {
      title: "Premium",
      price: "3500",
      statement: "For teams looking to scale efficiently.",
      highlight: true,
      items: [
        { children: "10 Pages Website", checked: true },
        { children: "Fully Responsive Design", checked: true },
        { children: "Standard SEO Optimization", checked: true },
        { children: "E-commerce Functionality", checked: true },
      ],
    },
    {
      title: "Advanced",
      price: "6000",
      statement: "For enterprises looking to scale.",
      items: [
        { children: "20 Pages Website", checked: true },
        { children: "Fully Custom Responsive Design", checked: true },
        { children: "Advanced SEO Services", checked: true },
        { children: "Full E-commerce Functionality", checked: true },
      ],
    },
  ];
  const featuresData = [
    {
      icon: <CiMobile1 size={50} className="text-indigo-500" />,
      title: "Responsive Design",
      description: "Ensuring your website looks stunning and functions perfectly on all devices, from desktops to tablets and smartphones. A seamless experience for every user, regardless of screen size.",
    },
    {
      icon: <RiSeoLine size={50} className="text-indigo-500" />,
      title: "SEO Optimization",
      description: "Improve your website's visibility on search engines with best-in-class SEO strategies. From keyword optimization to meta tags and speed enhancements, we help drive organic traffic and increase your online reach.",
    },
    {
      icon: <SiFsecure size={50} className="text-indigo-500" />,
      title: "Fast & Secure Hosting",
      description: "Experience ultra-fast loading speeds and top-tier security with our hosting solutions. Our servers are optimized for performance, ensuring 99.9% uptime and protection against cyber threats.",
    },
    {
      icon: <BiCustomize size={50} className="text-indigo-500" />,
      title: "Custom Features",
      description: "Get functionalities tailored to your business needs, from interactive elements and API integrations to advanced e-commerce solutions and automation. We build solutions that enhance user engagement and productivity.",
    },
  ];
  return (
    <>
      <ServiceBanner
        heading="Explore Affordable Web Development Plans"
        subHeading="We’d love to assist you! Whether you need a website, custom development, or pricing details, our team is ready to help."
        backgroundImage="/web-banner.jpg"
        ctaText="Contact Us"
        ctaLink="/contact-us"
        badgeText="Support Available"
        badgeLink="/support"
        additionalInfo="Our team is available 24/7 to assist you with any inquiries."
      />
      <NeuPricing
        heading="Flexible Web Development Pricing"
        pricingOptions={pricingOptions}
      />
      <ContactUsSection
        heading="Comprehensive Web Development Solutions"
        content="From design to deployment, we offer end-to-end web development services tailored to your business needs. Our expertise ensures a seamless, high-performance website that elevates your brand and enhances user experience."
      />
      <PricingFeaturesGrid features={featuresData} />
      <ContactUsSection
        heading="Crafting Stories Through Design"
        content="Explore a world where creativity meets precision. Each project is a testament to our passion, skill, and commitment to excellence. From concept to completion, we turn ideas into impactful realities, tailored to leave a lasting impression. Dive in and discover our journey of innovation and artistry."
      />
      <ShiftingContactForm />
    </>
  );
}

export default WebPricingPage;
