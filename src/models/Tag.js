const mongoose = require('mongoose')
const mongooseStringQuery = require('mongoose-string-query')
const timestamps = require('mongoose-timestamp')

const Schema = mongoose.Schema

const TagSchema = new Schema(
  {
    label: {
      type: String,
      require: true,
      trim: true
    },
    topic: {
      type: String,
      require: true,
      trim: true
    }
  },
	{ minimize: false }
)

TagSchema.plugin(timestamps)
TagSchema.plugin(mongooseStringQuery)

const Tag = mongoose.model('Tag', TagSchema)
module.exports = Tag
