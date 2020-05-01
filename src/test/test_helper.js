const mongoose = require('mongoose')

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/wbagtest')
mongoose.connection
  .once('open', () => console.log('Mongo Connected!'))
  .on('error', (error) => {
      console.warn('Error : ',error)
  })

beforeEach((done) => {
  mongoose.connection.collections.wbagtest.drop(() => {
    done()
  })
})

after((done) => {
  mongoose.connection.db.dropDatabase(() => {
    mongoose.connection.close(done)
  })
})