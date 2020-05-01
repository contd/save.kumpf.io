const mongoose = require('mongoose')
const mongooseStringQuery = require('mongoose-string-query')
const hasRolesAndClaims = require('gatemanjs').hasRolesAndClaims(mongoose)

const Schema = mongoose.Schema

const UserSchema = new Schema(
  {
    email: {
      type: String,
      require: true,
      trim: true
    },
    password: {
      type: String,
      require: true,
      trim: true
    }
  },
	{ minimize: false }
)

UserSchema.loadClass(hasRolesAndClaims)
UserSchema.plugin(mongooseStringQuery)

const User = mongoose.model('User', UserSchema)
module.exports = User
