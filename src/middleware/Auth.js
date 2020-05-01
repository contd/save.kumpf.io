const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

dotenv.config()

const Auth = {
  async verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization']
    let token = (req.session.token ? req.session.token : req.headers['x-access-token'])

    if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ')
      const bearerToken = bearer[1]
      token = bearerToken
    }

    if (!token) {
      //return res.status(400).send({ 'message': 'Token is not provided' })
      next()
    }
    try {
      const {error, decoded} = await jwt.verify(token, process.env.JWT_SECRET)

      if (error) {
        return res.status(400).send({ 'message': 'The token you provided is invalid' })
      }

      // req.user = {
      //   email: decoded.email,
      //   id: decoded.id
      // }
      // req.session.token = token
      next()

    } catch(error) {
      return res.status(400).send(error)
    }
  }
}

module.exports = Auth
