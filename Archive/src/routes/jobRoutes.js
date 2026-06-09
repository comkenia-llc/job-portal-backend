const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const mediaController = require("../controllers/mediaController");
const { authMiddleware, employerOrAdminMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");
const { requireActiveSubscription } = require("../middlewares/subscriptionMiddleware");
const upload = require("../middlewares/upload");

const jobsUpload = upload.fields([
    { name: "metaImage", maxCount: 1 },
]);

// 🟢 Public Routes
router.get("/", jobController.listJobs);
router.get("/company/:companyId", jobController.listJobsByCompany);
router.get("/:identifier/related", jobController.getRelatedJobs);
router.get("/:identifier", jobController.getJob);


const setJobsFolder = (req, _res, next) => {
    req.uploadFolder = "jobs";
    next();
};

const inlineImageUpload = upload.single("image");

// 🔵 Protected (Employer/Admin)
router.post(
    "/",
    authMiddleware,
    employerOrAdminMiddleware,
    requireActiveSubscription,
    setJobsFolder,
    jobsUpload,
    jobController.createJob
);
router.put(
    "/:id",
    authMiddleware,
    employerOrAdminMiddleware,
    requireActiveSubscription,
    setJobsFolder,
    jobsUpload,
    jobController.updateJob
);

router.post(
    "/media/upload",
    authMiddleware,
    employerOrAdminMiddleware,
    setJobsFolder,
    inlineImageUpload,
    mediaController.uploadImage
);

// 🔴 Admin Only
router.delete("/:id", authMiddleware, adminMiddleware, jobController.deleteJob);

// 🟣 Admin: Paginated & Searchable list
router.get(
    "/admin/all",
    authMiddleware,
    adminMiddleware,
    jobController.getAllJobsAdmin // 👈 new controller method
);

module.exports = router;
