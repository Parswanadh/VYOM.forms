// VYOM API — Netlify Function v2 with Blob storage
import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const MIME_TYPES = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
};

const STORE_NAME = "vyom-content";
const BLOB_KEY = "site-data";

const DEFAULT_DATA = {
  events: [
    {
      id: "1",
      title: "IISc Bangalore Open Day Visit",
      description: "Club executives visited IISc Bangalore during their open day, exploring cutting-edge research facilities and interacting with leading scientists.",
      image: "IISC_Bangalore_visit.jpg",
      category: "Educational Research Visit",
    },
    {
      id: "2",
      title: "Aarohan - Communications Workshop",
      description: "Outreach program for high school students demonstrating communications technology using custom-built NRF modules.",
      image: "aarohan.jpg",
      category: "STEM Outreach Program",
    },
    {
      id: "3",
      title: "Prakalp Spin Launch",
      description: "Groundbreaking prototype of a conceptual fuel-less satellite launch system using rotational kinetic energy.",
      image: "prakalp_spinlaunch.jpg",
      category: "Innovation & Research Project",
    },
  ],
  gallery: [
    { id: "1", src: "Coorg_star_gazing.jpg", title: "Coorg Star Gazing Expedition", description: "Star gazing trip to Coorg observing celestial wonders under pristine dark skies.", stats: { stat1: "25", stat2: "3", label1: "Participants", label2: "Days" } },
    { id: "2", src: "Cosmic_conundrum.jpg", title: "Cosmic Conundrum", description: "3-stage competitive event with space quizzes and buzzer rounds challenging astronomy knowledge.", stats: { stat1: "50", stat2: "3", label1: "Participants", label2: "Stages" } },
    { id: "3", src: "IISC_Bangalore_visit.jpg", title: "IISc Bangalore Open Day Visit", description: "Club executives visited IISc Bangalore exploring research facilities and interacting with scientists.", stats: { stat1: "15", stat2: "8", label1: "Executives", label2: "Hours" } },
    { id: "4", src: "aarohan.jpg", title: "Aarohan - Communications Workshop", description: "Outreach program for high school students on communications tech with NRF modules.", stats: { stat1: "40", stat2: "1", label1: "Students", label2: "Day" } },
    { id: "5", src: "prakalp_spinlaunch.jpg", title: "Prakalp Spin Launch", description: "Prototype of fuel-less satellite launch system using rotational kinetic energy.", stats: { stat1: "6", stat2: "4", label1: "Team Members", label2: "Months" } },
    { id: "6", src: "HAL_visit.jpg", title: "HAL Aerospace Museum Visit", description: "Educational trip exploring history of aviation and space technology in India.", stats: { stat1: "30", stat2: "1", label1: "Students", label2: "Day" } },
    { id: "7", src: "URSC_ISRO_visit.jpg", title: "URSC ISRO Center Visit", description: "Exclusive visit to URSC ISRO center learning about satellite technology.", stats: { stat1: "20", stat2: "4", label1: "Members", label2: "Hours" } },
    { id: "8", src: "Visvesvaraya_visit.jpg", title: "Visvesvaraya Science Museum", description: "Interactive science learning with hands-on physics demonstrations.", stats: { stat1: "35", stat2: "2", label1: "Attendees", label2: "Days" } },
  ],
  mentors: [
    { id: "1", name: "Manjunath sir", role: "Faculty Advisor | Physics Department", photo: "mentor.jpg", description: "Specializes in Physics research with impeccable knowledge on astronomy. Guides students in observational techniques and data analysis." },
  ],
  layout: {
    theme: "cosmic",
    animationEnabled: true,
    cardStyle: "glass",
  },
};

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
};

function checkAuth(req) {
  const password = req.headers.get("x-admin-password");
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return false;
  return password === adminPass;
}

export default async (req, context) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: HEADERS, status: 204 });

  try {
    const store = getStore(STORE_NAME);
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve uploaded images: GET /api/image/{key}
    if (req.method === "GET" && path.includes("/image/")) {
      const imgKey = path.split("/image/")[1];
      const blob = await store.get(imgKey, { type: "arrayBuffer" });
      if (!blob) return Response.json({ error: "Not found" }, { status: 404, headers: HEADERS });
      const ext = imgKey.split(".").pop() || "jpg";
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      return new Response(blob, { headers: { ...HEADERS, "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" } });
    }

    // Main data operations
    if (req.method === "GET") {
      let raw = await store.get(BLOB_KEY);
      let data = raw ? JSON.parse(raw) : DEFAULT_DATA;

      const section = url.searchParams.get("section");
      if (section && data[section]) return Response.json(data[section], { headers: HEADERS });
      return Response.json(data, { headers: HEADERS });
    }

    if (req.method === "POST") {
      if (!checkAuth(req)) return Response.json({ error: "Unauthorized" }, { status: 401, headers: HEADERS });

      const contentType = req.headers.get("Content-Type") || "";

      // Handle multipart file upload
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file");
        if (!file) return Response.json({ error: "No file" }, { status: 400, headers: HEADERS });

        // Generate key from timestamp + original filename
        const ext = file.name.split(".").pop() || "jpg";
        const key = `img-${crypto.randomUUID()}.${ext}`;
        const buffer = await file.arrayBuffer();

        await store.set(key, buffer);
        return Response.json({ ok: true, url: `/.netlify/functions/api/image/${key}`, key }, { headers: HEADERS });
      }

      // Handle JSON actions
      const body = await req.json();
      const { action, section, item } = body;

      let raw = await store.get(BLOB_KEY);
      let data = raw ? JSON.parse(raw) : structuredClone(DEFAULT_DATA);

      switch (action) {
        case "save-all":
          data = body.data;
          break;
        case "add":
          if (!data[section]) data[section] = [];
          data[section].push({ id: Date.now().toString(), ...item });
          break;
        case "update":
          if (data[section]) {
            const idx = data[section].findIndex((i) => i.id === item.id);
            if (idx !== -1) data[section][idx] = item;
          }
          break;
        case "delete":
          if (data[section]) data[section] = data[section].filter((i) => i.id !== item.id);
          break;
        case "update-layout":
          data.layout = { ...data.layout, ...item };
          break;
        default:
          return Response.json({ error: "Unknown action" }, { status: 400, headers: HEADERS });
      }

      await store.set(BLOB_KEY, JSON.stringify(data));
      return Response.json({ ok: true, data }, { headers: HEADERS });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405, headers: HEADERS });
  } catch (err) {
    console.error("API Error:", err);
    return Response.json({ error: err.message }, { status: 500, headers: HEADERS });
  }
};
