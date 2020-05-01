const mongoose = require('mongoose')
const Logger = require('logplease')
const app = require('./app')

const logger = Logger.create('utils')
const port = process.env.SERVER_PORT || 3334

// MongoDB/Mongoose
Promise = global.Promise
mongoose.set('useFindAndModify', false)

let mongoConn = `${process.env.MONGO_ADDRS || 'localhost:27017'}/${process.env.MONGO_DB || 'wbag'}`

if (process.env.MONGO_USER && process.MONGO_USER !== "") {
  mongoConn = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${mongoConn}`;
} else {
  mongoConn = `mongodb://${mongoConn}`
}

// Server
app.listen(port, () => {
  mongoose.connect(mongoConn, { useNewUrlParser: true, useUnifiedTopology: true })
  const db = mongoose.connection

  db.on('error', err => {
    logger.error(err)
    process.exit(1)
  })

  db.once('open', () => {
    logger.info(`Connected to Mongo server ${mongoConn}`)
    logger.info(`Express started at http://localhost:${port}`)
  })
})
