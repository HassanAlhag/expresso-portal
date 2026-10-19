import express from "express";
import { privateBucket, resolveLocalToken } from "../../utils/privateStorage.js";

// Development download route for private files stored on local disk.
// The token is a short-lived signed link issued after an authorization check
// elsewhere; in S3 mode links point straight at S3 and this route is unused.
const router = express.Router();

router.get("/:token", (req, res) => {
  if (privateBucket()) return res.status(404).json({ ok: false, message: "Not found" });
  try {
    const { path: filePath, filename, inline } = resolveLocalToken(req.params.token);
    res.set("Cache-Control", "private, no-store");
    if (inline) {
      res.set("Content-Disposition", `inline; filename="${filename.replace(/["\r\n]/g, "")}"`);
      return res.sendFile(filePath);
    }
    return res.download(filePath, filename);
  } catch {
    return res.status(404).json({ ok: false, message: "Link expired or invalid" });
  }
});

export default router;
