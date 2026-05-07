import OurServicesDropdown from "./DropDowns/ourService";
import SolutionsDropdown from "./DropDowns/SolutionsDropdown";

const LINKS = [
  { text: "Home", href: "/" },
  { text: "About Us", href: "/about-us" },
  { text: "Digital Services", href: "/services", FlyoutContent: OurServicesDropdown, flyoutWidth: 940 },
  { text: "Technology Solutions", href: "/it-solutions", FlyoutContent: SolutionsDropdown, flyoutWidth: 1060 },
  { text: "Portfolio", href: "/our-portfolio" },
  { text: "Careers", href: "/careers" },
  { text: "Build Your Plan", href: "/build-your-plan" },
];

export default LINKS;
