import { groupTechnologySolutions } from "./technologyGroups";
import { buildMenus } from "../components/MainHeader/navData";

const groups = [{ id: "business-software", label: "Business Software" }];
const CAS = { slug: "cas", kind: "digital", title: "CAS", group: "" };
const ERP = { slug: "erp-solution", title: "ERP Solution", group: "business-software" };

test("CAS never appears under Technology Solutions, even in a mixed list", () => {
  const grouped = groupTechnologySolutions([ERP, CAS], groups);
  const slugs = grouped.flatMap((g) => g.items.map((i) => i.slug));
  expect(slugs).toEqual(["erp-solution"]);
  expect(grouped.some((g) => g.id === "other-technology")).toBe(false);
});

test("technology products never appear as Expresso-owned Digital Solutions", () => {
  const menu = buildMenus({ digital: [CAS, ERP], digitalLoaded: true }).find((m) => m.key === "digital-solutions");
  expect(menu.featured.map((f) => f.to)).toEqual(["/digital-solutions/cas", "/digital-solutions/business-suite"]);
});

test("a list with only technology records retains core Digital Solutions without leaking technology", () => {
  const menu = buildMenus({ digital: [ERP], digitalLoaded: true }).find((m) => m.key === "digital-solutions");
  expect(menu.featured.map((f) => f.to)).toEqual(["/digital-solutions/cas", "/digital-solutions/business-suite"]);
  expect(menu.groups).toEqual([]);
});
