const { successResponse } = require('../utils/response');

class AuthController {
  verify(req, res) {
    return successResponse(res, {
      statusCode: 200,
      message: 'Token berhasil diverifikasi',
      data: req.user,
    });
  }
}

module.exports = new AuthController();
