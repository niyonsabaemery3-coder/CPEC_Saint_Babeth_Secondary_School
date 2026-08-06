require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const teacherAccountRoutes = require("./routes/teacherAccountRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const faqRoutes = require("./routes/faqRoutes");
const siteRoutes = require("./routes/siteRoutes");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "15mb" })); // generous limit: resources/reports arrive as base64

// Uploaded files (resource files, application reports, site images) are
// served directly as static files.
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/teacher-accounts", teacherAccountRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/site", siteRoutes);

// Centralised error handler — routes above don't need individual try/catch
// wrappers thanks to this, since Express 5-style async errors bubble here.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✔ API running at http://localhost:${PORT}`);
});
