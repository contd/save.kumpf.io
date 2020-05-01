const bcrypt = require('bcrypt')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const TurndownService = require('turndown')
const turndownPluginGfm = require('turndown-plugin-gfm')

dotenv.config()

const options = {
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
}
const turndownService = new TurndownService(options)
const gfm = turndownPluginGfm.gfm
const tables = turndownPluginGfm.tables
const strikethrough = turndownPluginGfm.strikethrough
turndownService.use([gfm, tables, strikethrough])

const Helper = {
  hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
  },

  comparePassword(hashPassword, password) {
    return bcrypt.compareSync(password, hashPassword)
  },

  isValidEmail(email) {
    //return /\S+@\S+\.\S+/.test(email)
    const re = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    return re.test(email)
  },

  generateToken(email, id) {
    const userInfo = {
      email,
      id,
    }
    const token = jwt.sign(userInfo,
      process.env.JWT_SECRET, { expiresIn: '14d' }
    )
    return token
  },

  async turnDown(html) {
    try {
      const makrdown = await turndownService.turndown(html)
      return {
        makrdown,
        error: null,
      }
    } catch (err) {
      return {
        markdown: null,
        error: err,
      }
    }
  },

  whichView(req) {
    if (req.query.view && req.query.view === 'list') {
      return 'list'
    } else {
      return 'index'
    }
  },

  switchView(view, url) {
    if (view === 'list') {
      return {
        label: 'Cards',
        url: url,
        type: 'cards'
      }
    } else {
      return {
        label: 'List',
        url: url,
        type: 'list'
      }
    }
  },
}

module.exports = Helper
