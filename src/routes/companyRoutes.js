const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authMiddleware, employerOrAdminMiddleware, adminMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../config/multer');

// Create company (only employer or admin)
router.post('/',
    authMiddleware,
    employerOrAdminMiddleware,
    upload.fields
        ([
            { name: "logo", maxCount: 1 },
            { name: "banner", maxCount: 1 },
        ]),
    companyController.createCompany);

// List all companies (public)
router.get('/', companyController.getCompanies);

// Admin Only
router.get("/admin/all", authMiddleware, isAdmin, companyController.getAllCompaniesAdmin )
// Get company by ID (public)
router.get('/:id', companyController.getCompanyById);

// Update company (only employer or admin)
router.put('/:id',
    authMiddleware,
    employerOrAdminMiddleware,
    upload.fields
        ([
            { name: "logo", maxCount: 1 },
            { name: "banner", maxCount: 1 },
        ]),
    companyController.updateCompany);

// Delete company (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, companyController.deleteCompany);

module.exports = router;
