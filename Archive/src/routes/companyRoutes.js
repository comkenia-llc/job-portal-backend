const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const mediaController = require("../controllers/mediaController");
const { authMiddleware, employerOrAdminMiddleware, adminMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// 🧩 Middleware to dynamically set upload folder
const setUploadFolder = (req, res, next) => {
    // Save logos and banners under companies/<type>
    req.uploadFolder = "companies"; // base folder (uploads/companies)
    next();
};

const inlineImageUpload = upload.single("image");

// Create company (only employer or admin)
router.post(
    "/",
    authMiddleware,
    employerOrAdminMiddleware,
    setUploadFolder,
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "banner", maxCount: 1 },
        { name: "metaImage", maxCount: 1 },
    ]),
    companyController.createCompany
);


// List all companies (public)
router.get("/", companyController.getCompanies);

// 🏢 Company: Get active plan + usage + features
router.get("/plan", authMiddleware, companyController.getCompanyPlan);


router.get(
    "/analytics",
    authMiddleware,
    employerOrAdminMiddleware,
    companyController.getCompanyAnalytics
)
// Admin Only
router.get("/admin/all", authMiddleware, isAdmin, companyController.getAllCompaniesAdmin);

// Get company by ID (public)
router.get("/slug/:slug", companyController.getCompanyBySlug);
router.get("/:id", companyController.getCompanyById);

// Update company (only employer or admin)
router.put(
    "/:id",
    authMiddleware,
    employerOrAdminMiddleware,
    setUploadFolder,
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "banner", maxCount: 1 },
        { name: "metaImage", maxCount: 1 },
    ]),
    companyController.updateCompany
);

router.post(
    "/media/upload",
    authMiddleware,
    employerOrAdminMiddleware,
    setUploadFolder,
    inlineImageUpload,
    mediaController.uploadImage
);


// Delete company (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, companyController.deleteCompany);

module.exports = router;
