const express = require('express')
const router = express.Router()
const Logger = require('logplease')
const logger = Logger.create('utils')
const Annotation = require('../models/Annotation')

router.get('/search', (req, res, next) => {
  let query
  const re = new RegExp(req.query.host, 'i')

  switch (req.query.context) {
    case 'document':
      query = Annotation.find({
        'uri': req.query.uri.replace(/\/$/, '')
      })
      break
    case 'dashboard':
      query = Annotation.find({})
      query.where('uri').regex(re)
      break
    case 'public':
      query = Annotation.find({})
      var pattern = new RegExp("\/public\/(.+)$", 'i')
      var match = pattern.exec(req.query.uri.replace(/\/$/, ''))
      var slug = match[1]
      query.where('uri').regex(new RegExp(slug, "i"))
      break
    case 'search':
      query = Annotation.find({})
      query.where('uri').regex(re)
      if (req.query.uri) {
        query.where('uri').equals(req.query.uri)
      }
      break
  }

  switch (req.query.mode) {
    case 'user':
      query.where('user').equals(req.query.user)
      break
    case 'group':
      query.where('subgroups').in(req.query.subgroups)
      query.$where('this.permissions.read.length < 1')
      break
    case 'class':
      query.where('groups').in(req.query.groups)
      query.$where('this.permissions.read.length < 1')
      break
    case 'admin':
      break
  }

  if (req.query.tags) {
    query.where('tags').in(req.query.tags.split(/[\s,]+/))
  }
  if (req.query.annotation_categories) {
    query.where('annotation_categories').in(req.query.annotation_categories)
  }

  query.limit(req.query.limit)

  if (req.query.sidebar || req.query.context == "dashboard" || req.query.context == "search") {
    query.exec((err, annotations) => {
      if (!err) {
        if (annotations.length > 0) {
          res.send(annotations)
          next()
        } else {
          res.status(204).send('Successfully deleted annotation.')
          next()
        }
      } else {
        logger.error(err)
        next(new Error(err))
      }
    })
  } else {
    query.exec((err, annotations) => {
      if (!err) {
        if (annotations.length > 0) {
          res.send({
            'rows': annotations
          })
          next()
        } else {
          res.status(204).send('Successfully deleted annotation.')
          next()
        }
      } else {
        logger.error(err)
        next(new Error(err))
      }
    })
  }
})

router.get('/annotations', (_, res, next) => {
  return Annotation.find({}, (err, annotations) => {
    if (!err) {
      res.send(annotations)
      next()
    } else {
      logger.error(err)
      next(new Error(err))
    }
  })
})

router.get('/annotations/:id', (_, res, next) => {
  return Annotation.findById(req.params.id, (err, annotation) => {
    if (!err) {
      res.send(annotation)
      next()
    } else {
      logger.error(err)
      next(new Error(err))
    }
  })
})

router.post('/annotations', (req, res, next) => {
  const annotation = new Annotation({
    user: req.body.user,
    username: req.body.username,
    consumer: "annotationstudio.mit.edu",
    annotator_schema_version: req.body.annotator_schema_version,
    created: Date.now(),
    updated: Date.now(),
    text: req.body.text,
    uri: req.body.uri,
    src: req.body.src,
    quote: req.body.quote,
    tags: req.body.tags,
    groups: req.body.groups,
    subgroups: req.body.subgroups,
    uuid: req.body.uuid,
    parentIndex: req.body.parentIndex,
    ranges: req.body.ranges,
    shapes: req.body.shapes,
    permissions: req.body.permissions,
    annotation_categories: req.body.annotation_categories,
    sort_position: req.body.sort_position
  })

  annotation.save(err => {
    if (!err) {
      res.send(annotation)
      next()
    } else {
      logger.error(err)
      next(new Error(err))
    }
  })
})

router.post('/annotations/positions', (_, res, next) => {
  for(annotation_id in req.body.sort_positions) {
    Annotation.update({ uuid: annotation_id }, { $set: { sort_position: req.body.sort_positions[annotation_id] }}, () => { });
  }
  res.send('Positions have been updated')
  next()
})

router.put('/annotations/:id', (req, res) => {
  return Annotation.findById(req.params.id, (_, annotation) => {
    annotation._id = req.body._id
    annotation.id = req.body._id
    annotation.user = req.body.user
    annotation.username = req.body.username
    annotation.consumer = req.body.consumer
    annotation.annotator_schema_version = req.body.annotator_schema_version
    annotation.created = req.body.created
    annotation.updated = Date.now()
    annotation.text = req.body.text
    annotation.uri = req.body.uri
    annotation.url = req.body.url
    annotation.shapes = req.body.shapes
    annotation.quote = req.body.quote
    annotation.tags = req.body.tags
    annotation.groups = req.body.groups
    annotation.subgroups = req.body.subgroups
    annotation.uuid = req.body.uuid
    annotation.parentIndex = req.body.parentIndex
    annotation.ranges = req.body.ranges
    annotation.permissions = req.body.permissions
    annotation.annotation_categories = req.body.annotation_categories
    annotation.sort_position = req.body.sort_position

    return annotation.save(err => {
      if (!err) {
        res.send(annotation)
        next()
      } else {
        logger.error(err)
        next(new Error(err))
      }
    })
  })
})

router.delete('/annotations/:id', (req, res) => {
  return Annotation.findById(req.params.id, (_, annotation) => {
    return annotation.remove(err => {
      if (!err) {
        res.status(204).send('Successfully deleted annotation.')
        next()
      } else {
        logger.error(err)
        next(new Error(err))
      }
    })
  })
})

module.exports = router