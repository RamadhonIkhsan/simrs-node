const { successResponse } = require('../utils/response');

class AuthController {
  verify(req, res) {
    return successResponse(res, {
      statusCode: 200,
      message: 'Berhasil',
      data: req.user,
    });
  }
}

module.exports = new AuthController();
