const express = require("express");
const router = express.Router();
const controller = require("../controllers/locationController");
const {
    authMiddleware,
    adminMiddleware,
} = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// ====================================================
// 🌍 Public Routes
// ====================================================

// Get paginated locations
router.get("/", controller.getAllLocations);
router.get("/slug/:slug/hub", controller.getLocationHubBySlug);
// Get featured (for homepage)
router.get("/featured", controller.getFeaturedLocations);

// Get full hierarchical tree
router.get("/tree", controller.getLocationTree);

// Get countries for dropdowns
router.get("/countries", controller.getCountries);

// Search locations (autocomplete)
router.get("/search", controller.searchLocations);

// Get single location by slug
router.get("/slug/:slug", controller.getLocationBySlug);

// Get single location by ID
router.get("/:id", controller.getLocationById);



// ====================================================
// 🔒 Protected Admin Routes
// ====================================================

// Create location (admin only)
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    upload.fields([
        { name: "flag", maxCount: 1 },
        { name: "metaImage", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    controller.createLocation
);

// Update location (admin only)
router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    upload.fields([
        { name: "flag", maxCount: 1 },
        { name: "metaImage", maxCount: 1 },
        { name: "image", maxCount: 1 },
    ]),
    controller.updateLocation
);

// Delete location (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, controller.deleteLocation);

module.exports = router;
