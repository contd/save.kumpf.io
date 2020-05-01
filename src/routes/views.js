const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const Link = require('../models/Link')
const User = require('../models/User')
const tags = require('../models/tags.json')
const Logger = require('logplease')
const logger = Logger.create('utils')
const TurndownService = require('turndown')
const turndownPluginGfm = require('turndown-plugin-gfm')
const Mercury = require('@postlight/mercury-parser')
const jwt = require('jsonwebtoken')

const THE_SECRET_KEY=process.env.JWT_SECRET

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

const hashPassword = password => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
}

const comparePassword = (hashPassword, password) => {
  return bcrypt.compareSync(password, hashPassword)
}

const whichView = (req) => {
  if (req.query.view && req.query.view === 'list') {
    return 'list'
  } else {
    return 'index'
  }
}

const switchView = (view, url) => {
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
}

//=============== JWT MIDDLEWARE =========================================================================
// MIDDLEWARE
function verifyToken (req, res, next) {
  const bearerHeader = req.headers['authorization']

  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  } else if (req.session.token) {
    req.token = req.session.token
    next()
  } else {
    next()
  }
}

// GET /login
router.get('/login', (req, res) => {
  res.render('login')
})
router.get('/logout', (req, res) => {
  req.session.token = undefined
  req.token = undefined
  res.redirect('back')
})
// POST /login
router.post('/login', (req, res) => {
  // Get userInfo from User model in mongodb
  const queryPromise = User.findOne({ email: req.body.email }).exec()
  queryPromise.then(userInfo => {
    if (!userInfo) {
      logger.error(`AUTH FAIL: User does not exist!`)
      res.render('error', {links: null, error: 'User does not exist!'})
    } else {
      if (!comparePassword(userInfo.password, req.body.password)) {
        logger.error(`AUTH FAIL: Invalid password!`)
        res.render('error', {links: null, error: 'Invalid password!'})
      } else {
        // If valid then create, sign and send back the token
        const token = jwt.sign({ userInfo }, THE_SECRET_KEY)
        req.session.token = token
        req.token = token
        res.redirect('/')
      }
    }
  })
  .catch(err => {
    logger.error(`QUERY ERROR: ${err}`)
    res.render('error', { links: null, error: err })
  })
})

//=============== Handlebars Rendered routes ============================================================
// GET /
router.get('/', verifyToken, (req, res) => {
  const queryPromise = Link.find({ is_starred: true }).sort({created_at: -1}).exec()
  let view = 'pubview'
  let sview = switchView(view, '/')
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (!err || err === 'null') {
      view = whichView(req)
      sview = switchView(view, '/')
    }

    queryPromise.then(links => {
      res.render(view, {links: links, tags: tags, view: sview })
    })
    .catch(err => {
      logger.error(err)
      res.render(view,  {links: null, tags: tags, view: sview })
    })
  })
})
//
// GET /by/:tag
router.get('/by/:tag', verifyToken, (req, res) => {
  const tag = req.params.tag
  const queryPromise = Link.find({ is_archived: false, tags: tag }).sort({created_at: -1}).exec()
  let view = 'pubview'
  let sview = switchView(view, `/by/${tag}`)
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (!err || err === 'null') {
      view = whichView(req)
      sview = switchView(view, '/')
    }

    queryPromise.then(links => {
      res.render(view, {links: links, tags: tags, tag: tag, view: sview })
    })
    .catch(err => {
      logger.error(err)
      res.render(view, {links: null, tags: tags, error: err, view: sview })
    })
  })
})
//
// GET /archive
router.get('/archive', verifyToken, (req, res) => {
  const tag = 'javascript'
  const queryPromise = Link.find({ is_archived: true, tags: tag }).sort({created_at: -1}).exec()
  let view = 'pubview'
  let sview = switchView(view, `/archive`)
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (!err || err === 'null') {
      view = whichView(req)
      sview = switchView(view, '/')
    }

    queryPromise.then(links => {
      res.render(view, {links: links, tags: tags, tag: tag, archive: true, view: sview })
    })
    .catch(err => {
      logger.error(err)
      res.render(view, {links: null, tags: tags, error: err, archive: true, view: sview })
    })
  })
})
//
// GET /archive/:tag
router.get('/archive/:tag', verifyToken, (req, res) => {
  const tag = req.params.tag
  const queryPromise = Link.find({ is_archived: true, tags: tag }).sort({created_at: -1}).exec()
  let view = whichView(req)
  let sview = switchView(view, `/archive/${tag}`)
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (!err || err === 'null') {
      view = whichView(req)
      sview = switchView(view, '/')
    }

    queryPromise.then(links => {
      res.render(view, {links: links, tags: tags, tag: tag, archive: true, view: sview })
    })
    .catch(err => {
      logger.error(err)
      res.render(view, {links: null, tags: tags, error: err, archive: true, view: sview })
    })
  })
})
//
// GET /contents/:id
router.get('/contents/:id', verifyToken, (req, res) => {
  const queryPromise = Link.find({ _id: req.params.id }).exec()
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (err) {
      res.redirect('/')
    } else {
      queryPromise.then(doc => {
        res.render('contents', {layout: 'details', links: doc, error: null })
      })
      .catch(err => {
        logger.error(err)
        res.render('error', { links: null, error: err })
      })
    }
  })
})
// GET /editor/:id
router.get('/editor/:id', verifyToken, (req, res) => {
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (err) {
      logger.error(`AUTH FAIL: ${err}`)
      res.sendStatus(401).render('error', {links: null, error: err})
    } else {
      const queryPromise = Link.find({ _id: req.params.id }).exec()

      queryPromise.then(doc => {
        res.sendStatus(200).render('editor', {links: doc, error: null })
      })
      .catch(err => {
        logger.error(err)
        res.sendStatus(401).render('error', { links: null, error: err })
      })
    }
  })
})
//
// TOGGLE /starred/:id (toggle starred)
router.get('/starred/:id', verifyToken, (req, res) => {
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (err) {
      res.redirect('back')
    } else {
      const findBy = { _id: req.params.id }
      const options = { new: false }
      const refer = req.get('Referrer')

      Link.findById(findBy, (err, link) => {
        if (err) {
          logger.error(err)
          res.redirect(refer)
        } else {
          const data = Object.assign({}, req.body, { is_starred: !link.is_starred })

          Link.findOneAndUpdate(findBy, data, options, (err, updLink) => {
            if (err) {
              logger.error(err)
            } else {
              logger.info(`Toggled ${link._id}: ${!updLink.is_starred}`)
            }
            res.redirect(refer)
          })
        }
      })
    }
  })
})
//
// TOGGLE /archive/:id
router.get('/archived/:id', verifyToken, (req, res) => {
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (err) {
      res.redirect('back')
    } else {
      const findBy = { _id: req.params.id }
      const options = { new: false }
      const refer = req.get('Referrer')

      Link.findById(findBy, (err, link) => {
        if (err) {
          logger.error(err)
          res.redirect(refer)
        } else {
          const data = Object.assign({}, req.body, { is_archived: !link.is_archived })

          Link.findOneAndUpdate(findBy, data, options, (err, updLink) => {
            if (err) {
              logger.error(err)
            } else {
              logger.info(`Toggled ${link._id}: ${!updLink.is_archived}`)
            }
            res.redirect(refer)
          })
        }
      })
    }
  })
})
//
// DELETE /remove/:id
router.get('/remove/:id', verifyToken, (req, res) => {
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (err) {
      res.redirect('back')
    } else {
      const findBy = { _id: req.params.id }
      const refer = req.get('Referrer')

      Link.findByIdAndDelete(findBy, (err, doc) => {
        if (err) {
          logger.error(err)
        } else {
          logger.info(`Deleted: ${doc._id}`)
        }
        res.redirect(refer)
      })
    }
  })
})
//
// PUT /save?url=...
router.get('/save', verifyToken, (req, res) => {
  const token = req.session.token ? req.session.token : req.token

  jwt.verify(token, THE_SECRET_KEY, err => {
    if (err) {
      res.redirect('back')
    } else {
      // First run url through mercury
      const srcUrl = req.query.url
      const defTag = req.query.tag || 'javascript'
      const refer = req.get('Referrer') || '/'

      Mercury.parse(srcUrl).then(async result => {
        let contentMD = ''
        // Make markdown version
        try {
          contentMD = await turndownService.turndown(result.content)
        } catch(err) {
          logger.error(`Error Creating Markdown: ${err}`)
        }
        // Now we can save it with a little modification
        const newEntry = {
          title: result.title,
          url: result.url,
          reading_time: Math.round(result.word_count/130),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          domain_name: result.domain,
          preview_picture: result.lead_image_url || null,
          content: result.content,
          marked: contentMD,
          tags: [defTag],
          is_starred: true,
          is_archived: false,
          cached: {
            status: 'NONE',
            filename: null,
            fullpath: null
          }
        }
        // Adde to database
        await Link.create(newEntry, (err, newLink) => {
          if (err) {
            logger.error(err)
          } else {
            logger.info(`Created new link: ${newLink.url} ${newLink.id}`)
          }
          res.redirect(refer)
        })
      })
    }
  })
})

module.exports = router
