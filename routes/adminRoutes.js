const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { createEmployee, activateEmployee } = require('../controllers/adminController');

// Admin routes protected by adminAuth (expects ADMIN_KEY in header or env)
router.post('/create-employee', adminAuth, createEmployee);
router.patch('/activate/:id', adminAuth, activateEmployee);

module.exports = router;
