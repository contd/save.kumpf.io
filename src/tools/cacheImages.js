const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const parse = require('url-parse')
const { promisify } = require('util')
const mongoose = require('mongoose')
const Link = require('../models/Link')

const writeFile = promisify(fs.writeFile)

const writeResults = async (results) => {
  const now = new Date()
  const outFile = path.join(__dirname, `cache_image_results_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}.json`)
  await writeFile(outFile, JSON.stringify(results, null, 2))
    .then(() => {
      console.log(`${chalk.green(`Wrote results to: ${path.basename(outFile)}`)}`)
    })
    .catch(err => {
      console.log(`${chalk.red(`Error writing results: ${err}`)}`)
    })
}

const downloadImages = async () => {
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
  const queryPromise = Link.find({ preview_picture: { $ne: null } }).exec()
  queryPromise.then(async links => {
    let count = {
      rewrite: [],
      cached: [],
      rename: [],
      exists: [],
      download: [],
      error: {
        four04: [],
        reqerr: []
      }
    }

    for (let entry of links) {
      if (entry.cached.status !== 'DONE') {
        const rawUrl = JSON.stringify(entry.preview_picture).replace(/"/g,'')
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

        if (rawUrl.includes('http://wbag.kumpf.home')) {
          // Update those where wallabag already cached and replace with new url/path
          // both in the preview_picture and content
          let preview_picture = rawUrl.replace('http://wbag.kumpf.home/assets/images', '/cache')
          let newContent = entry.content.replace(/http\:\/\/wbag\.kumpf\.home\/assets\/images/g, '/cache')
          updEntry.preview_picture = preview_picture
          updEntry.content = newContent
          // Push to results
          count.rewrite.push({
            id: entry._id,
            title: entry.title,
            url: entry.url,
            preview_picture: preview_picture
          })
          // Update entry in Mongo
          Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
            if (err) {
              console.log(`${chalk.red(`UPDATE ERROR [${updEntry.id}]:`)} ${err}`)
            } else {
              console.log(`${chalk.green(`UPDATE SUCCESS: ${updated.preview_picture}`)}`)
            }
          })
        } else if (rawUrl.startsWith('/cache')) {
          updEntry.cached.status = 'DONE'
          updEntry.cached.filename = path.basename(entry.preview_picture)
          // Push to results
          count.cached.push({
            id: entry._id,
            title: entry.title,
            url: entry.url,
            preview_picture: rawUrl,
            cached: updEntry.cached
          })
          // Update entry in Mongo
          Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
            if (err) {
              console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
            } else {
              console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}, ${updated.cached.filename}]`)}`)
            }
          })
        } else {
          if (entry.cached.filename && entry.cached.filename !== '') {
            const prevPic = `/cache/${entry.cached.filename}`

            updEntry.preview_picture = prevPic
            updEntry.cached.status = 'DONE'
            if (updEntry.cached.fullpath) {
              updEntry.cached.fullpath = updEntry.cached.fullpath.replace('/btrfs/home/develop/current-projects/nodejs/wbag/src/public','')
            }
            // Push to results
            count.rename.push({
              id: entry._id,
              title: entry.title,
              url: entry.url,
              preview_picture: prevPic,
              cached: updEntry.cached
            })
            // Update entry in Mongo
            Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
              if (err) {
                console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
              } else {
                console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}, ${updated.cached.filename}]`)}`)
              }
            })
          } else {
            const url = parse(rawUrl)
            let fname = path.basename(url.pathname)
            const exten = path.extname(fname)
            // Get error if path/filename is more than 256 (play safe with 255)
            if (fname.length > 255) {
              // because path to filename can already be long
              fname = `${fname.substr(0, 100)}${exten}`
            }
            fname = fname.replace(/ /g,'_')
            fname = fname.replace(/%20/g,'_')
            const filename = `${entry.id}__${fname}`
            const filepath = path.resolve(__dirname, '..', 'public', 'cache', filename)

            if (fs.existsSync(filepath)) {
              updEntry.preview_picture = `/cached/${filename}`
              updEntry.cached.status = 'DONE'
              updEntry.cached.filename = filename
              updEntry.cached.fullpath = filepath
              // Push to results
              count.exists.push({
                id: entry._id,
                title: entry.title,
                url: entry.url,
                preview_picture: updEntry.preview_picture,
                cached: updEntry.cached
              })
              // Update entry in Mongo
              /*
              Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
                if (err) {
                  console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
                } else {
                  console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.preview_picture}]`)}`)
                }
              })
              */
            } else {
              try {
                const resp = await axios({
                  method: 'GET',
                  url: rawUrl,
                  responseType: 'stream'
                })
                try {
                  resp.data.pipe(fs.createWriteStream(filepath))
                  // Update entry in Mongo
                  updEntry.preview_picture = `/cached/${filename}`
                  updEntry.cached.status = 'DONE'
                  updEntry.cached.filename = filename
                  updEntry.cached.fullpath = filepath
                  // Push to results
                  count.download.push({
                    id: entry._id,
                    title: entry.title,
                    url: entry.url,
                    preview_picture: updEntry.preview_picture,
                    cached: updEntry.cached
                  })
                  Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
                    if (err) {
                      console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
                    } else {
                      console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}, ${updated.cached.filename}]`)}`)
                    }
                  })
                } catch (error) {
                  console.log(`${chalk.red(`SAVING ERROR [${entry.id}, ${filepath}]:`)} ${error}`)
                }
              } catch (error) {
                if (error.response && error.response.status === 404) {
                  updEntry.preview_picture = null
                  updEntry.cached.status = 'ERROR'
                  updEntry.cached.filename = null
                  updEntry.cached.fullpath = null
                  // Push to results
                  count.error.four04.push({
                    id: entry._id,
                    title: entry.title,
                    url: entry.url,
                    preview_picture: rawUrl,
                    cached: updEntry.cached
                  })
                  // Update entry in Mongo
                  /*
                  Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
                    if (err) {
                      console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
                    } else {
                      console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}]`)}`)
                    }
                  })
                  */
                } else if (error.request) {
                  updEntry.preview_picture = null
                  updEntry.cached.status = 'ERROR'
                  updEntry.cached.filename = null
                  updEntry.cached.fullpath = null
                  // Push to results
                  count.error.reqerr.push({
                    id: entry._id,
                    title: entry.title,
                    url: entry.url,
                    preview_picture: rawUrl
                  })
                  Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
                    if (err) {
                      console.log(`${chalk.red(`UPDATE ERROR [${updEntry.cached.status}, ${updEntry.cached.filename}]:`)} ${err}`)
                    } else {
                      console.log(`${chalk.green(`UPDATE SUCCESS: [${updated.cached.status}]`)}`)
                    }
                  })
                } else {
                  console.log(`${chalk.res(`ERROR MSG: ${error.message}`)}`)
                }
              }
            }
          }
        }
      }
    }
    console.log(`
      ${chalk.green(`Results:`)}
        ${chalk.yellow(`rewrite : ${chalk.cyan(count.rewrite.length)}`)}
        ${chalk.yellow(`cached  : ${chalk.cyan(count.cached.length)}`)}
        ${chalk.yellow(`rename  : ${chalk.cyan(count.rename.length)}`)}
        ${chalk.yellow(`exists  : ${chalk.cyan(count.exists.length)}`)}
        ${chalk.yellow(`download: ${chalk.cyan(count.download.length)}`)}
        ${chalk.yellow(`404error: ${chalk.cyan(count.error.four04.length)}`)}
        ${chalk.yellow(`reqerror: ${chalk.cyan(count.error.reqerr.length)}`)}
    `)
    await writeResults(count)
    db.close()
  })
  .catch((err) => {
    console.log(`ERROR: ${err}`)
    process.exit(1)
  })
}

downloadImages()
