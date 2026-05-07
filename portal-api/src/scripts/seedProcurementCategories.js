/**
 * Seeds the 3-level procurement category hierarchy.
 * Run: node src/scripts/seedProcurementCategories.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import ProcurementCategory from "../modules/procurement/category.model.js";

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TREE = [
  {
    code: "10",
    name: "Information Technology",
    level: 1,
    children: [
      {
        code: "11",
        name: "IT Equipment & Hardware",
        level: 2,
        children: [
          { code: "111", name: "PC Laptop - PC Desktop - Peripherals & Accessories", level: 3 },
          { code: "112", name: "Servers - Racks - Networking Equipment - Storages", level: 3 },
          { code: "113", name: "Network & VAS Hardware - Security & Firewall Hardware", level: 3 },
          { code: "114", name: "IT Equipment & Hardware - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "12",
        name: "IT Software",
        level: 2,
        children: [
          { code: "121", name: "Data Management & Information Management Software", level: 3 },
          { code: "122", name: "Operating Systems - Enterprise Resources Management Software", level: 3 },
          { code: "123", name: "IT Software - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "13",
        name: "Communication Systems",
        level: 2,
        children: [
          { code: "131", name: "Access Control - Attendance System - Surveillance & CCTVs", level: 3 },
          { code: "132", name: "Audio-Visual Presentation System - Broadcasting Equipment", level: 3 },
          { code: "133", name: "Communication System - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "14",
        name: "Application & Development",
        level: 2,
        children: [
          { code: "141", name: "Development & Programming Services", level: 3 },
          { code: "142", name: "System Support Services", level: 3 },
          { code: "143", name: "Application & Development - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "15",
        name: "IT Managed & Professional Services",
        level: 2,
        children: [
          { code: "151", name: "IT Network Integration Service", level: 3 },
          { code: "152", name: "Desk & Infrastructure Services", level: 3 },
          { code: "153", name: "Communication Technology System Support", level: 3 },
          { code: "154", name: "IT Managed System - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "16",
        name: "Backup Services",
        level: 2,
        children: [
          { code: "161", name: "Cloud Services", level: 3 },
          { code: "162", name: "Backup & Storage Services", level: 3 },
          { code: "163", name: "Backup Services - Miscellaneous", level: 3 },
        ],
      },
    ],
  },
  {
    code: "20",
    name: "Technology",
    level: 1,
    children: [
      {
        code: "21",
        name: "Telecom Equipment Access & Distribution NW",
        level: 2,
        children: [
          { code: "211", name: "Cable & Wireless Network", level: 3 },
          { code: "212", name: "Fiber Technology & Copper Network", level: 3 },
          { code: "213", name: "Telecom Equipment - Access & Distribution NW - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "22",
        name: "Telecom Equipment Transmission Equipment",
        level: 2,
        children: [
          { code: "221", name: "Optical Transmission Equipment", level: 3 },
          { code: "222", name: "Radio & Microwave Transmission Equipment", level: 3 },
          { code: "223", name: "Satellite Transmission Equipment", level: 3 },
          { code: "224", name: "Telecom Equipment Transmission - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "23",
        name: "Telecom Equipment Core Network",
        level: 2,
        children: [
          { code: "231", name: "Switching Equipment - PSTN - Soft Switching", level: 3 },
          { code: "232", name: "Service & Management Equipment - Billing System - OCS", level: 3 },
          { code: "233", name: "IP - IN - VAS Solutions", level: 3 },
          { code: "234", name: "Telecom Equipment Core Network - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "24",
        name: "Out-Side Plants",
        level: 2,
        children: [
          { code: "241", name: "Towers, Shelters & Steel Structure", level: 3 },
          { code: "242", name: "Cabling Ducts & Accessories", level: 3 },
          { code: "243", name: "OSP Tools & Instruments", level: 3 },
          { code: "244", name: "Out-Side Plants - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "26",
        name: "Network Quality & Security Equipment & Hardware",
        level: 2,
        children: [
          { code: "261", name: "IDPS - DLP - SSL/TLS - Wireless Network Security", level: 3 },
          { code: "262", name: "TMN Systems", level: 3 },
          { code: "263", name: "Network Testing & Monitoring - Network Optimization & Acceleration", level: 3 },
          { code: "264", name: "Network Quality & Security Equipment - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "27",
        name: "Power, Electrical & Control Systems",
        level: 2,
        children: [
          { code: "271", name: "Conventional Power Generation Units - Diesel Generating Sets", level: 3 },
          { code: "272", name: "Renewable & Hybrid Power Solution Systems", level: 3 },
          { code: "273", name: "Remote Management Systems - Building Management Systems", level: 3 },
        ],
      },
      {
        code: "28",
        name: "Instruments & Measurements Equipment & Tools",
        level: 2,
        children: [
          { code: "281", name: "Measurement & Instrument Tools - Optimization Devices", level: 3 },
          { code: "282", name: "Mechanical Service Tools & Service Kits", level: 3 },
          { code: "283", name: "Instruments & Measurements Equipment & Tools - Miscellaneous", level: 3 },
        ],
      },
    ],
  },
  {
    code: "30",
    name: "Commercial & Corporate Communication Supplies",
    level: 1,
    children: [
      {
        code: "31",
        name: "CPE",
        level: 2,
        children: [
          { code: "311", name: "Handsets - IP Phone - Terminals", level: 3 },
          { code: "312", name: "Data Modems - Hotspots Wi-Fi - Routers - Internet Terminals", level: 3 },
          { code: "313", name: "Corporate CPEs", level: 3 },
          { code: "314", name: "SIM Cards", level: 3 },
          { code: "315", name: "Rechargeable Vouchers", level: 3 },
          { code: "316", name: "EVDs - E-Recharge Systems", level: 3 },
          { code: "317", name: "CPEs - Miscellaneous", level: 3 },
        ],
      },
      {
        code: "32",
        name: "Advertising & Branded Materials",
        level: 2,
        children: [
          { code: "321", name: "Flyers - Leaflets - Booklets - Posters", level: 3 },
          { code: "322", name: "Indoor Advertisement - Mesh Stickers - Rollup Stand Banner", level: 3 },
          { code: "323", name: "Outdoor Banners - Billboard - Digital Banners", level: 3 },
          { code: "324", name: "Digital Platform - Marketing Applications & Softwares", level: 3 },
          { code: "325", name: "Giveaways - Diaries - Agenda - Branded Stuffs", level: 3 },
          { code: "326", name: "Presents - Prizes - Electronic Gifts", level: 3 },
          { code: "327", name: "Advertising & Branded Materials - Miscellaneous", level: 3 },
        ],
      },
    ],
  },
  {
    code: "50",
    name: "Education & Publishes",
    level: 1,
    children: [
      {
        code: "51",
        name: "Management & Consultancy Service",
        level: 2,
        children: [
          { code: "511", name: "Management Consultancy", level: 3 },
          { code: "512", name: "Legal Services", level: 3 },
          { code: "513", name: "Management & Consultation Service - Miscellaneous", level: 3 },
        ],
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected to MongoDB");

  let created = 0;
  let skipped = 0;

  for (const [mainIdx, main] of TREE.entries()) {
    const mainSlug = `cat-${main.code}-${slug(main.name)}`;

    let mainDoc = await ProcurementCategory.findOne({ code: main.code, level: 1 });
    if (!mainDoc) {
      mainDoc = await ProcurementCategory.create({
        name: main.name,
        slug: mainSlug,
        code: main.code,
        level: 1,
        parentId: null,
        order: mainIdx * 10,
      });
      created++;
      console.log(`  + [L1] ${main.code}: ${main.name}`);
    } else {
      skipped++;
    }

    for (const [catIdx, cat] of (main.children || []).entries()) {
      const catSlug = `cat-${cat.code}-${slug(cat.name)}`;

      let catDoc = await ProcurementCategory.findOne({ code: cat.code, level: 2 });
      if (!catDoc) {
        catDoc = await ProcurementCategory.create({
          name: cat.name,
          slug: catSlug,
          code: cat.code,
          level: 2,
          parentId: mainDoc._id,
          order: catIdx * 10,
        });
        created++;
        console.log(`    + [L2] ${cat.code}: ${cat.name}`);
      } else {
        skipped++;
      }

      for (const [subIdx, sub] of (cat.children || []).entries()) {
        const subSlug = `cat-${sub.code}-${slug(sub.name)}`;

        const exists = await ProcurementCategory.findOne({ code: sub.code, level: 3 });
        if (!exists) {
          await ProcurementCategory.create({
            name: sub.name,
            slug: subSlug,
            code: sub.code,
            level: 3,
            parentId: catDoc._id,
            order: subIdx * 10,
          });
          created++;
          console.log(`      + [L3] ${sub.code}: ${sub.name}`);
        } else {
          skipped++;
        }
      }
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped (already exist): ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
