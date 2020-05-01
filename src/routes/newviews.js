const express = require('express')
const router = express.Router()
const Logger = require('logplease')
const Auth = require('../middleware/Auth')
const Links = require('../controllers/Links')
const Users = require('../controllers/Users')
const Helper = require('../controllers/Helper')

const logger = Logger.create('utils')
let view = 'pubview'
let sview = Helper.switchView(view, '/')

const checkUserView = req => {
  if (req.user) {
    view = Helper.whichView(req)
    sview = Helper.switchView(view, '/')
  }
}

const renderView = (res, next, linksObj, tag = 'javascript', archive = false) => {
  const data = { links: linksObj.links, tags: linksObj.tags, tag: tag, error: linksObj.error, view: sview }
  if (archive) {
    data.archive = true
  }
  if (linksObj.error) {
    // res.sendStatus(500).render(...) a custom error page/view with error object
    next()
  } else {
    res.sendStatus(200).render(view, data)
  }
}

const renderOther = (res, next, linksObj, altview, layout = 'main') => {
  const data = { layout: layout, links: linksObj.link, error: linksObj.error }
  if (linksObj.error) {
    // res.sendStatus(500).render(...) a custom error page/view with error object
    next()
  } else {
    res.sendStatus(200).render(altview, data)
  }
}

router.get('/login', (_, res) => {
  res.render('login')
})

router.get('/logout', (req, res) => {
  req.session.token = undefined
  req.token = undefined
  res.redirect('back')
})

router.post('/login', (req, res, next) => {
  if (req.body && req.body.email && req.body.password) {
    const loginRes = Users.login(req.body.email, req.body.password)
    if (loginRes.error) {
      logger.error(loginRes.error)
      res.sendStatus(loginRes.status).send(loginRes.message)
      res.redirect('/login')
    } else {
      req.session.token = loginRes.token
      req.token = loginRes.token
      req.user = loginRes.user
      res.redirect('/')
    }
  }
})

router.get('/', Auth.verifyToken, (_, res, next) => {
  checkUserView()
  const linksObj = Links.getFront()
  renderView(res, next, linksObj)
})

router.get('/by/:tag', Auth.verifyToken, (req, res, next) => {
  const tag = req.params.tag
  checkUserView()
  const linksObj = Links.getByTag(tag)
  renderView(res, next, linksObj)
})

router.get('/archive', Auth.verifyToken, (req, res, next) => {
  const tag = req.params.tag || 'javascript'
  checkUserView()
  const linksObj = Links.getArchived(tag)
  renderView(res, next, linksObj)
})

router.get('/contents/:id', Auth.verifyToken, (req, res, next) => {
  const id = req.params.id
  checkUserView()
  const linkObj = Links.getById(id)
  renderOther(res, next, linkObj, 'contents', 'details')
})

router.get('/editor/:id', Auth.verifyToken, (req, res, next) => {
  const id = req.params.id
  checkUserView()
  const linkObj = Links.getById(id)
  renderOther(res, next, linkObj, 'editor')
})

router.get('/starred/:id', Auth.verifyToken, (req, res, next) => {
  const id = req.params.id
  checkUserView()
  const linkObj = Links.toggleSetting(id, 'starred', req.body)
  if (linkObj.error) {
    logger.error(linkObj.error)
  }
  res.redirect(req.get('Referrer'))
})

router.get('/archived/:id', Auth.verifyToken, (req, res, next) => {
  const id = req.params.id
  checkUserView()
  const linkObj = Links.toggleSetting(id, 'archive', req.body)
  if (linkObj.error) {
    logger.error(linkObj.error)
  }
  res.redirect(req.get('Referrer'))
})

router.get('/remove/:id', Auth.verifyToken, (req, res, next) => {
  const id = req.params.id
  checkUserView()
  const linkObj = Links.trashById(id)
  if (linkObj.error) {
    logger.error(linkObj.error)
  }
  res.redirect(req.get('Referrer'))
})

router.get('/save', Auth.verifyToken, (req, res, next) => {
  const srcUrl = req.query.url
  const defTag = req.query.tag || 'javascript'
  checkUserView()
  const linkObj = Links.saveLink(srcUrl, defTag)
  if (linkObj.error) {
    logger.error(linkObj.error)
  }
  res.redirect('/')
})

export default router
