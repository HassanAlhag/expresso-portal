// Jobs board stage behaviour (P3-7, R4-D). The board's columns come only from
// pipeline.js; these tests pin its movement rules. Coverage of the API's job
// statuses is checked by docs/architecture/validate.cjs (no runtime import of
// API code into the client).
import { JOB_STAGES, getColumnKey, canMove, nextStage, prevStage } from "./pipeline";

const COLUMNS = ["brief", "scripting", "production", "review", "approved", "published", "done"];

test("the board has seven columns in order, each status in exactly one column", () => {
  expect(JOB_STAGES.map((s) => s.key)).toEqual(COLUMNS);
  const all = JOB_STAGES.flatMap((s) => s.statuses);
  expect(new Set(all).size).toBe(all.length);
  for (const stage of JOB_STAGES) {
    for (const status of stage.statuses) expect(getColumnKey(status)).toBe(stage.key);
    // Moving into a column applies a status that belongs to that column.
    expect(getColumnKey(stage.moveStatus)).toBe(stage.key);
  }
});

test("on hold and archived jobs sit in Done; an unknown status falls back to Brief", () => {
  expect(getColumnKey("on_hold")).toBe("done");
  expect(getColumnKey("archived")).toBe("done");
  expect(getColumnKey("not-a-status")).toBe("brief");
  expect(getColumnKey(undefined)).toBe("brief");
});

test("a job moves only to its own or a neighbouring column", () => {
  expect(canMove("brief", "scripting")).toBe(true);
  expect(canMove("content_ready", "brief")).toBe(true);
  expect(canMove("editing", "review")).toBe(true);
  expect(canMove("editing", "scripting")).toBe(true);
  expect(canMove("brief", "production")).toBe(false);
  expect(canMove("delivered", "brief")).toBe(false);
  expect(canMove("brief", "nowhere")).toBe(false);
});

test("next and previous stage apply the neighbouring column's move status and stop at the ends", () => {
  expect(nextStage("brief")).toBe("script");
  expect(nextStage("pre_production")).toBe("editing");
  expect(nextStage("client_review")).toBe("approved");
  expect(nextStage("scheduled")).toBe("published");
  expect(nextStage("published")).toBe("delivered");
  expect(nextStage("archived")).toBe("delivered");
  expect(prevStage("delivered")).toBe("published");
  expect(prevStage("shooting")).toBe("script");
  expect(prevStage("content_ready")).toBe("brief");
});
