const chalk = require('chalk')
const mongoose = require('mongoose')
const TurndownService = require('turndown')
const turndownPluginGfm = require('turndown-plugin-gfm')
const Link = require('../models/Link')

const makeMarkdowns = async () => {
  const options = {
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  }
  const turndownService = new TurndownService(options)
  const gfm = turndownPluginGfm.gfm
  const tables = turndownPluginGfm.tables
  const strikethrough = turndownPluginGfm.strikethrough
  turndownService.use([gfm, tables, strikethrough])

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

  let count = {
    total: 0,
    update: 0,
    error: 0,
    empty: []
  }
  // BEGIN
  const queryPromise = Link.find({marked: null}).exec()
  queryPromise.then(async links => {
    count.total = links.length
    // Start loop
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

      if (entry.content && !entry.marked) {
        let contentMD = ''
        try {
          contentMD = await turndownService.turndown(entry.content)
          updEntry.marked = contentMD

          const findBy = { _id: entry.id }
          const options = { new: false }
          // Update entry in Mongo
          await Link.findOneAndUpdate(findBy, updEntry, options, (err, updated) => {
            if (err) {
              count.error++
              console.log(`${chalk.red(`UPDATE ERROR [${updEntry.title}]:`)} ${err}`)
            } else {
              count.update++
              console.log(`${chalk.green(`UPDATE SUCCESS: ${updated.title}`)}`)
            }
          })
        } catch (error) {
          console.log(`${chalk.red(`MARKED ERROR: ${error.message}`)}`)
        }
      } else {
        count.empty.push({ id: entry._id })
        console.log(`${chalk.yellow(`Empty Content: ${entry._id}`)}`)
      }
    }
    console.log(`
      ${chalk.yellow(`Results:`)}
        ${chalk.green(`total   : ${chalk.cyan(count.total)}`)}
        ${chalk.green(`updated : ${chalk.cyan(count.update)}`)}
        ${chalk.green(`empty   : ${chalk.cyan(count.empty.length)}`)}
        ${chalk.green(`errors  : ${chalk.cyan(count.error)}`)}
    `)
    // Close connection
    db.close()
  })
  .catch((err) => {
    console.log(`ERROR: ${err}`)
    process.exit(1)
  })
}

makeMarkdowns()
