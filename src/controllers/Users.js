const Helper = require('./Helper')
const User = require('../models/User')
const Logger = require('logplease')
const logger = Logger.create('utils')
const returnMsg = (status, message) => {
  return {
    status,
    message,
  }
}

const Users = {
  create(email, password) {
    if (!email || !password) {
      return res.status(400).send()
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return returnMsg(400, 'Please enter a valid email address')
    }
    const hashPassword = Helper.hashPassword(password)
    const newEntry = {
      email,
      password: hashPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createUserPromise = User.create(newEntry).exec()
    createUserPromise.then(newUser => {
      const token = Helper.generateToken(newUser.email, newUser.id)
      logger.info(token)
      return {
        status: 201,
        user: newUser,
        token,
      }
    })
    .catch(error => {
      logger.error(error)
      return returnMsg(400, error.message)
    })
  },

  login(email, password) {
    if (!email || !password) {
      return returnMsg(400, 'Some values are missing')
    }

    const userPromise = User.find({ email: email }).exec()
    userPromise.then((selUser) => {
      if (!selUser) {
        logger.error('The credentials you provided is incorrect')
        return returnMsg(400, 'The credentials you provided is incorrect')
      }
      if(!Helper.comparePassword(selUser.password, password)) {
        logger.error('The credentials you provided is incorrect')
        return returnMsg(400, 'The credentials you provided is incorrect')
      }
      const token = Helper.generateToken(selUser.email, selUser.id)
      logger.info(token)
      return {
        status: 200,
        user: selUser,
        token,
      }
    })
    .catch(error => {
      logger.error(`Hashpwd: ${selUser.password} - ReqPass: ${password} - Error: ${error}`)
      return returnMsg(400, error.message)
    })
  },

  getUser(email) {
    const queryPromise = User.find({ email: email }).exec()
    queryPromise.then(selUser => {
      if (!selUser) {
        return {
          status: 400,
          user: null,
          error: 'Username not found.',
        }
      } else {
        return {
          status: 200,
          user: selUser,
          error: null,
        }
      }
    })
    .catch(err => {
      logger.error(err)
      return {
        status: 500,
        user: null,
        error: err,
      }
    })
  },

  delete(email) {
    const queryPromise = User.find({ email: email }).exec()
    queryPromise.then(selUser => {
      if(!selUser) {
        logger.error('user not found')
        return returnMsg(404, 'user not found')
      }
      const delUserPromise = User.deleteOne({ email: email }).exec()
      delUserPromise.then(() => {
        logger.info('deleted')
        return returnMsg(204, 'deleted')
      })
      .catch(error => {
        logger.error(error)
        return returnMsg(500, error.message)
      })
    })
    .catch(error => {
      logger.error(error)
      return returnMsg(500, error.message)
    })
  }
}

module.exports = Users
