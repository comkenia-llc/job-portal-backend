// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const subscriptionController = require("./controllers/subscriptionController");
const { isAllowedOrigin } = require("./utils/market");
const { marketMiddleware } = require("./middlewares/marketMiddleware");

const app = express();

// ====================================================
// 🌐 CORS Configuration
// ====================================================
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                console.warn("🚫 Blocked CORS request from:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true, // ✅ allow cookies for SSO
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Market", "x-market"],
    })
);

// ====================================================
// 🧩 Middleware
// ====================================================
// Stripe webhook (needs raw body)
app.post(
    "/api/subscriptions/webhook",
    express.raw({ type: "application/json" }),
    subscriptionController.stripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Add here
app.use(marketMiddleware);
app.use(morgan("dev"));


// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// ====================================================
// 📦 Routes
// ====================================================
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const companyRoutes = require("./routes/companyRoutes");
const locationRoutes = require("./routes/locationRoutes");
const globalSettingsRoutes = require("./routes/globalSettingsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const featureRoutes = require("./routes/featureRoutes");
const planRoutes = require("./routes/planRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const blogRoutes = require("./routes/blogRoutes");
const guideRoutes = require("./routes/guideRoutes");
const employerRoutes = require("./routes/employerRoutes");
const aiRoutes = require("./routes/aiRoutes");
const savedJobRoutes = require("./routes/savedJobRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const skillRoutes = require("./routes/skillRoutes");
const jobFunctionRoutes = require("./routes/jobFunctionRoutes");
const skillCategoryRoutes = require("./routes/skillCategoryRoutes");
const jobCategoryRoutes = require("./routes/jobCategoryRoutes");
const companyCategoryRoutes = require("./routes/companyCategoryRoutes");
const chatRoutes = require("./routes/chatRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const affordabilityRoutes = require("./routes/affordabilityRoutes");
const jobAutomationRoutes = require("./routes/jobAutomationRoutes");
const jobAlertRoutes = require("./routes/jobAlertRoutes");
const walkinRoutes = require("./routes/walkin-routes");
const jobIndustryRoutes = require("./routes/jobIndustryRoutes");



app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/job-functions", jobFunctionRoutes);
app.use("/api/global-settings", globalSettingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/features", featureRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/skill-categories", skillCategoryRoutes);
app.use("/api/job-categories", jobCategoryRoutes);
app.use("/api/company-categories", companyCategoryRoutes);
app.use("/api/job-industries", jobIndustryRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/affordability", affordabilityRoutes);
app.use("/api/admin/job-automation", jobAutomationRoutes);
app.use("/api/job-alerts", jobAlertRoutes);
app.use("/api/walkin", walkinRoutes);
// ====================================================
// 🏠 Root
// ====================================================
app.get("/", (req, res) => {
    res.json({ message: "🚀 Job Portal API running" });
});

// ====================================================
// ⚠️ Global Error Handler
// ====================================================
app.use((err, req, res, next) => {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = app;
