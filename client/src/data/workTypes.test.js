import fs from "fs";
import path from "path";
import { WORK_TYPES } from "./workTypes";

// The website is deployed separately from the API and keeps its own copy of
// the work-type labels; it must name exactly the API's work types.
test("website work types match the API's WORK_TYPES", () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "../../../portal-api/src/modules/portfolio/workItem.constants.js"),
    "utf8"
  );
  const api = [...src.matchAll(/\{\s*key:\s*"([a-z]+)",\s*label:\s*"([^"]+)"\s*\}/g)].map((m) => [m[1], m[2]]);
  expect(api.length).toBeGreaterThan(0);
  expect(WORK_TYPES.map((t) => [t.key, t.label])).toEqual(api);
});
