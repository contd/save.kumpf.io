const Mercury = require('@postlight/mercury-parser')
const Link = require('../models/Link')
const tags = require('../models/tags.json')
const Helper = require('./Helper')
const Logger = require('logplease')
const logger = Logger.create('utils')

const Links = {
  // getFront(): GET / (which is only starred items to appear on front page)
  getFront() {
    const queryPromise = Link.find({ is_starred: true }).sort({created_at: -1}).exec()
    queryPromise.then(links => {
      return {
        links,
        tags,
        error: null,
      }
    })
    .catch(err => {
      logger.error(err)
      return {
        links: null,
        tags,
        error: err,
      }
    })
  },
  // getByTag(tag?): GET /by/:tag
  getByTag(tag = 'javascript') {
    const queryPromise = Link.find({ is_archived: false, tags: tag }).sort({created_at: -1}).exec()
    queryPromise.then(links => {
      return {
        links,
        tags,
        tag,
        error: null,
      }
    })
    .catch(err => {
      logger.error(err)
      return {
        links: null,
        tags,
        tag,
        error: err,
      }
    })
  },
  // getArchived(tag?): GET /archive
  getArchived(tag = 'javascript') {
    const queryPromise = Link.find({ is_archived: true, tags: tag }).sort({created_at: -1}).exec()
    queryPromise.then(links => {
      return {
        links,
        tags,
        tag,
        archive: true,
        error: null,
      }
    })
    .catch(err => {
      logger.error(err)
      return {
        links: null,
        tags,
        tag,
        archive: true,
        error: err,
      }
    })
  },
  // getById(id): GET /contents/:id
  getById(id) {
    const queryPromise = Link.find({ _id: id }).exec()
    queryPromise.then(link => {
      return {
        link,
        error: null,
      }
    })
    .catch(err => {
      logger.error(err)
      return {
        link: null,
        error: err,
      }
    })
  },
  // trashById(id): GET /delete/:id
  trashById(id) {
    const deletePromise = Link.findByIdAndDelete({ _id: id }).exec()
    deletePromise.then(link => {
      return {
        link,
        error: null,
      }
    })
    .catch(err => {
      logger.error(err)
      return {
        link: null,
        error: err,
      }
    })
  },
  // toggleSetting(id, which, body): GET /starred/:id OR GET /archive/:id
  toggleSetting(id, which = 'starred', body = {}) {
    const findBy = { _id: id }
    const options = { new: false }
    const getLinkPromise = Link.findById(findBy).exec()

    getLinkPromise.then(link => {
      let toggle = { is_starred: !link.is_starred }
      if (which !== 'starred') {
        toggle = { is_archived: !link.is_archived }
      }
      const data = Object.assign({}, body, toggle)
      const togglePromise = Link.findOneAndUpdate(findBy, data, options).exec()

      togglePromise.then(updLink => {
        return {
          link: updLink,
          error: null,
        }
      })
      .catch(err => {
        logger.error(err)
        return {
          link: null,
          error: err,
        }
      })
    })
    .catch(err => {
      logger.error(err)
      return {
        link: null,
        error: err,
      }
    })
  },
  // saveLink(url, tag?): GET /save?url...&tag=...
  saveLink(url, tag = 'javascript') {
    // Mercury parse then feed result to
    // TurndownService which is own module
    Mercury.parse(url).then(async result => {
      const turned = await Helper.turnDown(result.content)
      const markdown = turned.markdown || ''
      const newEntry = {
        title: result.title,
        url: result.url,
        reading_time: Math.round(result.word_count/130),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        domain_name: result.domain,
        preview_picture: result.lead_image_url || null,
        content: result.content,
        marked: markdown,
        tags: [tag],
        is_starred: true,
        is_archived: false,
        cached: {
          status: 'NONE',
          filename: null,
          fullpath: null
        }
      }

      const newLinkPromise = (await Link.create(newEntry)).exec()
      newLinkPromise.then(link => {
        return {
          link,
          error: null,
        }
      })
      .catch(err => {
        return {
          link: null,
          error: err,
        }
      })
    })
  },
  //
}

module.exports = Links
