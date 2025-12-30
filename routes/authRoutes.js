// const express = require('express');
// const router = express.Router();

// const { login, sendCode, validateCode, me, register } = require('../controllers/authController');
// const auth = require('../middleware/auth');

// // POST /api/auth/login
// router.post('/auth/login', login);

// // Public: register new employee via email/password
// router.post('/auth/register', register);

// // Protected: send code (admin or employee)
// router.post('/auth/send-code', auth, sendCode);

// // Public: validate code (POST /api/validate-code)
// router.post('/validate-code', validateCode);

// // Protected: get current authenticated employee
// router.get('/auth/me', auth, me);

// module.exports = router;



const express = require('express');
const router = express.Router();

const {
  login,
  register,
  validateCode,
  me
} = require('../controllers/authController');

const auth = require('../middleware/auth');

router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/validate-code', auth, validateCode);
router.get('/auth/me', auth, me);

module.exports = router;
