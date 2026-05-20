import AboutDropdown from "./DropDowns/AboutDropdown";
import OurServicesDropdown from "./DropDowns/ourService";
import SolutionsDropdown from "./DropDowns/SolutionsDropdown";
import WorkWithUsDropdown from "./DropDowns/WorkWithUsDropdown";

const LINKS = [
  { text: "Home", href: "/" },
  {
    text: "About Us",
    href: "/about-us",
    FlyoutContent: AboutDropdown,
    flyoutWidth: 760,
    mobileLinks: [
      { text: "Our Story", href: "/about-us" },
      { text: "Portfolio", href: "/portfolio" },
      { text: "Case Studies", href: "/case-studies" },
      { text: "Our Clients", href: "/services#clients" },
    ],
  },
  {
    text: "Digital Services",
    href: "/services",
    FlyoutContent: OurServicesDropdown,
    flyoutWidth: 940,
    mobileLinks: [
      { text: "All Services", href: "/services" },
      { text: "Website Development", href: "/service/web-dev" },
      { text: "Social Media", href: "/service/social-media-marketing" },
      { text: "Google Ads", href: "/service/google-ads" },
      { text: "SEO Marketing", href: "/service/seo-marketing" },
      { text: "Videography", href: "/service/videography" },
      { text: "Content Creation", href: "/service/content-creation" },
    ],
  },
  {
    text: "Technology Solutions",
    href: "/it-solutions",
    FlyoutContent: SolutionsDropdown,
    flyoutWidth: 1060,
    mobileLinks: [
      { text: "All Solutions", href: "/it-solutions" },
      { text: "ERP Solution", href: "/it-solutions/erp-solution" },
      { text: "CRM Solution", href: "/it-solutions/crm-solution" },
      { text: "Cloud Services", href: "/it-solutions/cloud-services" },
      { text: "IoT Solutions", href: "/it-solutions/iot-solutions" },
      { text: "IT Consultation", href: "/it-solutions/it-consultation" },
      { text: "Web Hosting & Domains", href: "/it-solutions/web-hosting-domains" },
    ],
  },
  {
    text: "Work With Us",
    href: "/build-your-plan",
    FlyoutContent: WorkWithUsDropdown,
    flyoutWidth: 800,
    mobileLinks: [
      { text: "Build Your Plan", href: "/build-your-plan" },
      { text: "Request a Proposal", href: "/contact-us" },
      { text: "Careers", href: "/careers" },
      { text: "Contact Us", href: "/contact-us" },
    ],
  },
];

export default LINKS;
