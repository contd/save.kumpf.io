const path = require('path')
const compression = require('compression')
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const errorhandler = require('errorhandler')
const Handlebars = require('handlebars')
const exphbs = require('express-handlebars')
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')
const session = require('express-session')
const cors = require('cors')
const helmet = require('helmet')
const dotenv = require('dotenv')
dotenv.config()

const helpers = require('./helpers')
const views = require('./routes/views')
//const nviews = require('./routes/newviews')
const api = require('./routes/api')
const anno = require('./routes/anno')

const options = {
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: helpers,
  handlebars: allowInsecurePrototypeAccess(Handlebars)
}
const app = express()
app.engine('.hbs', exphbs(options))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', '.hbs')
app.use(compression())
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000
  }
}))
app.use(methodOverride())
app.use(cors())
app.use(helmet())
app.use(express.static('public'))
app.use((req, res, next) => {
  res.locals.session = req.session
  next()
})
// NewViews
//app.use('/v', nviews)
app.use('/', views)
app.use('/api', api)
app.use('/anno', anno)

if (process.env.NODE_ENV !== 'production') {
  app.use(errorhandler())
} else {
  app.use((err, _, res, next) => {
    logger.error(err.stack)
    res.status(500)
    res.render('error', { error: err })
    next(err)
  })
}

module.exports = app
