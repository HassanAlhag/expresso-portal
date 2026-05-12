import AboutDropdown from "./DropDowns/AboutDropdown";
import OurServicesDropdown from "./DropDowns/ourService";
import SolutionsDropdown from "./DropDowns/SolutionsDropdown";
import WorkWithUsDropdown from "./DropDowns/WorkWithUsDropdown";

const LINKS = [
  { text: "Home", href: "/" },
  { text: "About Us", href: "/about-us", FlyoutContent: AboutDropdown, flyoutWidth: 1020 },
  { text: "Digital Services", href: "/services", FlyoutContent: OurServicesDropdown, flyoutWidth: 940 },
  { text: "Technology Solutions", href: "/it-solutions", FlyoutContent: SolutionsDropdown, flyoutWidth: 1060 },
  { text: "Work With Us", href: "/contact-us", FlyoutContent: WorkWithUsDropdown, flyoutWidth: 960 },
];

export default LINKS;
