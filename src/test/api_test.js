const request = require('supertest')
const app = require('../app')
const mongoose = require('mongoose')

mongoose.Promise = global.Promise

mongoose.connect(`mongodb://localhost:27017/wbag`, { useNewUrlParser: true })

mongoose.connection
  .once('open', () => {
    //console.log('Mongo Connected!')
  })
  .on('error', (error) => {
      console.warn('Error : ',error)
  })

describe('GET /api', function() {
  it('respond with all unarchived links', function(done) {
    request(app)
      .get('/api')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done)
  })
})

after((done) => {
  mongoose.connection.close(done)
  //console.log('Closed Mongo Connection')
})