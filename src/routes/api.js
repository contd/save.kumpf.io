const express = require('express')
const router = express.Router()
const Link = require('../models/Link')
const Logger = require('logplease')
const logger = Logger.create('utils')
const jwt = require('jsonwebtoken')

const setDataObj = (req, idchk) => {
  let data = req.body || {}
  if (idchk && !data._id) {
    data = Object.assign({}, data, { _id: req.params.id })
  }
  return data
}

const runQueryRespond = (queryPromise, res, next) => {
  queryPromise.then(docs => {
    res.json(docs)
    next()
  })
  .catch(err => {
    logger.error(err)
    next(err)
  })
}

const updQueryRespond = (queryPromise, res, next) => {
  queryPromise.then(updLink => {
    res.status(200).send(updLink)
    next()
  })
  .catch(err => {
    logger.error(err)
    res.status(500)
    next(new Error(err))
  })
}

//
//=============== REST API routes ========================================================================
//
// GET /api
router.route('/')
  .all((req, res, next) => {
    next()
  })
  .get((_, res, next) => {
    const queryPromise = Link.find({ is_archived: false, is_starred: true }, { content: 0, marked: 0 })
      .sort({created_at: -1}).exec()
    runQueryRespond(queryPromise, res, next)
  })
// GET /api/:id
router.route('/:id')
  .all((req, res, next) => {
    next()
  })
  .get((req, res, next) => {
    const queryPromise = Link.findById({ _id: req.params.id }).exec()
    runQueryRespond(queryPromise, res, next)
  })
  .put((req, res, next) => {
    const findBy = { _id: req.params.id }
    const options = { new: false }
    const link = setDataObj(req, true)
    const queryPromise = Link.findOneAndUpdate(findBy, link, options).exec()
    updQueryRespond(queryPromise, res, next)
  })
// GET /api/search?tag=tag&archived=false
router.route('/search')
  .all((req, res, next) => {
    next()
  })
  .get((req, res, next) => {
    const params = {
      is_archived: req.params.archived ? true : false,
      tag: req.params.tag ? req.params.tag : 'javascript'
    }
    const queryPromise = Link.find(params).sort({created_at: -1}).exec()
    queryPromise.then(docs => {
      const results = docs.map(doc => {
        return {
          id: doc._id,
          title: doc.title,
          text: doc.marked,
        }
      })
      res.json(results)
      next()
    })
    .catch(err => {
      logger.error(err)
      next(err)
    })
  })
//
// GET /api/archive
router.route('/archive')
  .all((req, res, next) => {
    next()
  })
  .get((_, res, next) => {
    const tag = 'javascript'
    const queryPromise = Link.find({ is_archived: true, tags: tag}, { content: 0, marked: 0 })
      .sort({created_at: -1}).exec()
    runQueryRespond(queryPromise, res, next)
  })
// GET /api/archive/:tag
router.route('/archive/:tag')
  .all((req, res, next) => {
    next()
  })
  .get((req, res, next) => {
    const tag = req.params.tag
    const queryPromise = Link.find({ is_archived: true, tags: tag}, { content: 0, marked: 0 })
      .sort({created_at: -1}).exec()
    runQueryRespond(queryPromise, res, next)
  })
// GET /api/tags
router.route('/tags')
  .all((req, res, next) => {
    next()
  })
  .get((_, res, next) => {
    Link.distinct("tags").sort().exec()
    queryPromise.then(tags => {
      res.json(tags)
      next()
    })
    .catch(err => {
      logger.error(err)
      next(err)
    })
  })
// GET /api/contents/:id
router.route('/contents/:id')
  .all((req, res, next) => {
    next()
  })
  .get((req, res) => {
    const queryPromise = Link.find({ _id: req.params.id }).exec()
    runQueryRespond(queryPromise, res, next)
  })

// PUT /api/starred/:id
router.route('/starred/:id')
  .all((req, res, next) => {
    next()
  })
  .get((req, res) => {
    const findBy = { _id: req.params.id }
    const options = { new: false }

    Link.findById(findBy, (err, link) => {
      if (err) {
        logger.error(err)
        next(err)
      } else {
        const data = Object.assign({}, req.body, { is_starred: !link.is_starred })

        Link.findOneAndUpdate(findBy, data, options, (err, updLink) => {
          if (err) {
            logger.error(err)
          } else {
            logger.info(`Toggled ${link._id}: ${!updLink.is_starred}`)
          }
          res.status(200).send(updLink)
        })
      }
    })
  })

// PUT /api/archive/:id
router.route('/archived/:id')
  .all((req, res, next) => {
    next()
  })
  .get((req, res) => {
    const findBy = { _id: req.params.id }
    const options = { new: false }

    Link.findById(findBy, (err, link) => {
      if (err) {
        logger.error(err)
        next(err)
      } else {
        const data = Object.assign({}, req.body, { is_archived: !link.is_archived })

        Link.findOneAndUpdate(findBy, data, options, (err, updLink) => {
          if (err) {
            logger.error(err)
          } else {
            logger.info(`Toggled ${link._id}: ${!updLink.is_archived}`)
          }
          res.status(200).send(updLink)
        })
      }
    })
  })

//
// DELETE /remove/:id
router.route('/remove/:id')
  .all((req, res, next) => {
    next()
  })
  .get((req, res) => {
    const findBy = { _id: req.params.id }

    Link.findByIdAndDelete(findBy, (err, doc) => {
      if (err) {
        logger.error(err)
        next(err)
      } else {
        logger.info(`Deleted: ${doc._id}`)
        res.status(200).send(`Deleted: ${doc._id}`)
      }
    })
  })

// PUT /api/editor/:id
router.route('/editor/:id')
  .all((req, res, next) => {
    next()
  })
  .put((req, res, next) => {
    const findBy = { _id: req.params.id }
    const options = { new: false }
    const data = setDataObj(req, true)
    const queryPromise = Link.findOneAndUpdate(findBy, data, options).exec()
    updQueryRespond(queryPromise, res, next)
  })

module.exports = router
