import "./setup-env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import nodemailer from "nodemailer";

// Guards the A11 major-version upgrades (sharp 0.35, nodemailer 10).
test("sharp pipeline used by the media library still works", async () => {
  const png = await sharp({
    create: { width: 2000, height: 1200, channels: 3, background: "#8390C8" },
  })
    .png()
    .toBuffer();
  const out = await sharp(png)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  assert.equal(out.info.format, "webp");
  assert.equal(out.info.width, 1600);
});

test("nodemailer transport builds and sends", async () => {
  const t = nodemailer.createTransport({ jsonTransport: true });
  const info = await t.sendMail({ from: "a@test.local", to: "b@test.local", subject: "x", html: "<p>x</p>" });
  assert.ok(info.messageId);
});
