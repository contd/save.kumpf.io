const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const parse = require('url-parse')
const axios = require('axios')
const mongoose = require('mongoose')
const Link = require('../models/Link')
const Mercury = require('@postlight/mercury-parser')

const updateBulk = () => {
  const mongoConn = "mongodb://localhost:27017/wbag"

  mongoose.Promise = global.Promise
  mongoose.connect(mongoConn, { useNewUrlParser: true })
  mongoose.set('useFindAndModify', false)

  const db = mongoose.connection

  db.on('error', err => {
    console.log(err)
    process.exit(1)
  })

  db.once('open', () => {
    console.log(`Connected to Mongo server ${mongoConn}`)
  })

  // BEGIN
  Link.find({}, async (err, links) => {
    if (err) {
      console.log(`ERROR: ${err}`)
      process.exit(1)
    }

    for (let entry of links) {
      let updEntry = {
        title: entry.title,
        url: entry.url,
        tags: entry.tags,
        is_starred: entry.is_starred,
        is_archived: entry.is_archived,
        reading_time: entry.reading_time,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        reading_time: entry.reading_time,
        domain_name: entry.domain_name,
        preview_picture: entry.preview_picture,
        content: entry.content,
        cached: entry.cached
      }
      const findBy = { _id: entry.id }
      const options = { new: false }

      if (entry.cached.filename && entry.cached.filename !== '') {
        if (entry.preview_picture.startsWith('http')) {
          // Cache preview_picture for ones where still set to remote host
          // const prevPic = `/cache/${entry.cached.filename}`

          // if (!entry.preview_picture || entry.preview_picture === '') {
          //   updEntry.preview_picture = prevPic
          // }

          // updEntry.cached.status = 'DONE'

          // if (updEntry.cached.fullpath) {
          //   updEntry.cached.fullpath = updEntry.cached.fullpath.replace('/btrfs/home/develop/current-projects/nodejs/wbag/src/public','')
          // } else {
          //   updEntry.cached.fullpath = `/cache/${updEntry.cached.filename}`
          // }

          // // Push to results
          // const result = {
          //   id: entry._id,
          //   title: entry.title,
          //   url: entry.url,
          //   preview_picture: prevPic,
          //   cached: updEntry.cached
          // }

          // Update entry in Mongo
          // Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
          //   if (err) {
          //     console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
          //   } else {
          //     console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}, ${updated.cached.filename}]`)}`)
          //   }
          // })
        } else {
          Mercury.parse(entry.url).then(result => {
            updEntry.preview_picture = result.lead_image_url || ''
            updEntry.cached.status = 'NONE'
            updEntry.cached.filename = null
            updEntry.cached.fullpath = null

            //console.log(`${entry.preview_picture} - ${updEntry.preview_picture} - ${entry._id}`)
            if (updEntry.preview_picture && updEntry.preview_picture !== '') {
              const url = parse(updEntry.preview_picture)
              let fname = path.basename(url.pathname)
              const exten = path.extname(fname)

              // If path/filename is more than 256 (play safe with 255)
              if (fname.length > 255) {
                fname = `${fname.substr(0, 100)}${exten}`
              }
              const nfname = fname.replace(/[^A-Z0-9]+/ig, "-")
              const filename = `${entry.id}--${nfname}`
              const filepath = `./cache/${filename}`

              axios({
                method: 'GET',
                url: updEntry.preview_picture,
                responseType: 'stream'
              })
              .then(resp => {
                resp.data.pipe(fs.createWriteStream(filepath))
                // Update entry in Mongo
                updEntry.preview_picture = `/cached/${filename}`
                updEntry.cached.status = 'DONE'
                updEntry.cached.filename = filename
                updEntry.cached.fullpath = filepath

                console.log(chalk.green(`NEW: ${updEntry.preview_picture}`), chalk.cyan(`  ${updEntry.url}`))

                Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
                  if (err) {
                    console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
                  } else {
                    console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}, ${updated.cached.filename}]`)}`)
                  }
                })
              })
              .catch (error => {
                console.log(`${chalk.red(`Axios SAVING ERROR [${entry.id}, ${filepath}]:`)} ${error}`)
              })
            }
          })
          .catch(err => {
            console.log(`ERROR: Mercury.parse [${entry.url}]: ${err}`)
          })
        }
      }
    }
    db.close()
  })
}

updateBulk()
