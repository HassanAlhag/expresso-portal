import React from "react";
import { NeuPricing } from "../../components/ServicesComponents/pricing";
import { ServiceBanner } from "../../components/ServicesBanner/servicesBanner";
import ContactUsSection from "../../components/ContactUsSection/contactSection";
import PricingFeaturesGrid from "../../components/PricingFeatures/pricingFeatures";
import ShiftingContactForm from "../../components/ContactForm/contactForm";
import { RiMegaphoneLine } from "react-icons/ri";
import { MdContentPaste } from "react-icons/md";
import { BsPeople } from "react-icons/bs";
import { IoAnalyticsOutline } from "react-icons/io5";

function SocialMediaPricingPage() {
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
      icon: <RiMegaphoneLine size={50} className="text-indigo-500" />,
      title: "Targeted Advertising",
      description:
        "Maximize your brand’s reach with data-driven social media ad campaigns. We create and optimize ads that drive engagement, conversions, and ROI across platforms like Facebook, Instagram, and LinkedIn.",
    },
    {
      icon: <MdContentPaste size={50} className="text-indigo-500" />,
      title: "Content Strategy & Creation",
      description:
        "Engaging content is key to social media success. We craft high-quality visuals, videos, and captions tailored to your brand's voice, ensuring consistency and audience engagement.",
    },
    {
      icon: <IoAnalyticsOutline size={50} className="text-indigo-500" />,
      title: "Analytics & Performance Tracking",
      description:
        "Gain deep insights into your social media performance. Our real-time analytics help track audience engagement, post reach, and campaign effectiveness for data-driven improvements.",
    },
    {
      icon: <BsPeople size={50} className="text-indigo-500" />,
      title: "Community Management",
      description:
        "We help build strong relationships with your audience by managing comments, messages, and interactions, ensuring prompt responses and meaningful engagement.",
    },
  ];
  
  return (
    <>
      <ServiceBanner
        heading="Get in Touch with Social Media Pricing"
        subHeading="We'd love to hear from you! Whether you have questions, need assistance, or want to collaborate, our team is here to help."
        backgroundImage="/82.jpg"
        ctaText="Contact Us"
        ctaLink="/contact-us"
        badgeText="Support Available"
        badgeLink="/support"
        additionalInfo="Our team is available 24/7 to assist you with any inquiries."
      />
      <NeuPricing
        heading="Pricing Plans Content"
        pricingOptions={pricingOptions}
      />
      <ContactUsSection
        heading="Crafting Stories Through Seo Pricing"
        content="Explore a world where engagement meets strategy. Every campaign is a testament to our expertise, ensuring impactful content that connects with your audience. From creative storytelling to data-driven advertising, we help brands grow their online presence."
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

export default SocialMediaPricingPage;
