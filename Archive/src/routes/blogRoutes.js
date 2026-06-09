const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const { authMiddleware, employerOrAdminMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const setBlogFolder = (req, _res, next) => {
    req.uploadFolder = "blog";
    next();
};

const coverUpload = upload.single("coverImage");
const inlineImageUpload = upload.single("image");

// Public routes
router.get("/", blogController.listPublishedPosts);
router.get("/slug/:slug", blogController.getPostBySlug);

// Protected routes
router.use(authMiddleware, employerOrAdminMiddleware);
router.get("/mine/list", blogController.listMyPosts);
router.post("/", setBlogFolder, coverUpload, blogController.createPost);
router.put("/:id", setBlogFolder, coverUpload, blogController.updatePost);
router.post("/media/upload", setBlogFolder, inlineImageUpload, blogController.uploadInlineImage);
router.delete("/:id", blogController.deletePost);

module.exports = router;
