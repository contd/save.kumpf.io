const mongoose = require('mongoose')
const mongooseStringQuery = require('mongoose-string-query')
const timestamps = require('mongoose-timestamp')

const Schema = mongoose.Schema

const LinkSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
      trim: true
    },
    url: {
      type: String,
      require: true,
      trim: true
    },
    tags: {
      type: [String],
      require: true
    },
    is_archived: {
      type: Boolean,
      default: false
    },
    is_starred: {
      type: Boolean,
      default: false
    },
    reading_time: {
      type: Number,
      required: false
    },
    domain_name: {
      type: String,
      trim: true
    },
    preview_picture: {
      type: String,
      default: null
    },
    content: {
      type: String,
      required: true
    },
    marked: {
      type: String
    },
    created_at: {
      type: String,
      required: true
    },
    updated_at: {
      type: String,
      required: true
    },
    cached: {
      status: {
        type: String,
        require: true,
        trim: true
      },
      filename: {
        type: String,
        trim: true
      },
      fullpath: {
        type: String,
        trim: true
      }
    }
  },
	{ minimize: false }
)

LinkSchema.plugin(timestamps)
LinkSchema.plugin(mongooseStringQuery)

const Link = mongoose.model('Link', LinkSchema)
module.exports = Link