const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const parse = require('url-parse')
const data = require('../../db/wallabag.json')

const getPicFileName = (entry) => {
  const rawUrl = entry.preview_picture

  if (rawUrl) {
    const url = parse(rawUrl)
    let fname = path.basename(url.pathname)
    // Get error if path/filename is more than 256 (play safe with 255)
    if (fname.length > 255) {
      // because path to filename can already be long
      fname = fname.substr(0, 100)
    }
    const filename = `${entry.id}__${fname}`
    const filepath = path.resolve(__dirname, '..', 'public', 'cache', filename)

    return {
      filename,
      filepath
    }
  } else {
    return
  }
}

const writeFile = (links) => {
  const linksOutput = JSON.stringify(links)
  const outputFile = path.resolve(__dirname, 'links_raw.json')

  fs.writeFile(outputFile, linksOutput, (err) => {
    if (err) {
      console.log(`${chalk.red('WRITE-FILE-ERROR:')} ${err}`)
    }
    console.log(`${chalk.green('Saved to')} ${outputFile}`)
  })
}

const makeDb = () => {
  let links = []

  for (let entry of data) {

    const tags = entry.tag.split(',')
    const picture = getPicFileName(entry)
    const cached = {
      status: 'NONE',
      filename: (picture ? picture.filename : null),
      fullpath: (picture ? picture.filepath : null)
    }

    const new_entry = {
      title: entry.title,
      url: entry.url,
      tags: tags,
      is_starred: (entry.is_starred === 0 ? false : true),
      is_archived: (entry.is_archived === 0 ? false : true),
      reading_time: entry.reading_time,
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at),
      reading_time: parseInt(entry.reading_time),
      domain_name: entry.domain_name.replace('www.',''),
      preview_picture: entry.preview_picture,
      content: entry.content,
      cached: cached
    }

    console.log(`${chalk.green('Saving: ')} ${chalk.yellow(new_entry.title)} ${chalk.blue(new_entry.url)}`)

    links.push(new_entry)
  }
  writeFile(links)

  console.log(chalk.blue('All Done!'))
}

module.exports = {
  makeDb
}

makeDb()