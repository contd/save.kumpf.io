const chroma = require('chroma-js')
const tags = require('../models/tags.json')

let topics = [], map = {}

const colors = {
  developer: "#001F3F",
  humanity: "#3D9970",
  utility: "#FF4136",
  technology: "#7FDBFF",
  productivity: "#85144B",
  green: "#2ECC40",
  yellow: "#FFDC00",
  orange: "#FF851B",
  white: "#FFFFFF",
  silver: "#DDDDDD",
  gray: "#AAAAAA",
  black: "#111111"
}

console.log(`
.badge {
  border-radius: 3px;
  margin-left: 0.3em;
  padding: 0.3em;
  font-size: 0.7rem;
  font-family: inherit;
}

.badge-starred { background-color: #FFDC00; color: #111111; }
.badge-starred:hover { background-color: #c7ab00; color: #111111; }
`)
console.log(' ')

for (let tag of tags) {
  
  if (map[tag.topic]) {
    map[tag.topic].tags.push(tag.label)
  } else {
    const topic = {
      name: tag.topic,
      color: colors[tag.topic],
      tags: [tag.label]
    }
    map[tag.topic] = topic
    topics.push(tag.topic)
  }
}

for (let tname of topics) {
  const topic = map[tname]
  const ttags = topic.tags
  const color = topic.color
  const ecolor = chroma(color).brighten(2)
  const num = topic.tags.length

  const tagcolors = chroma.scale([color, ecolor]).colors(num)
  console.log(`/*=== ${tname} ================ */`)

  for (let i in ttags) {
    const bgcolor = tagcolors[i]
    let hovercolor = chroma(tagcolors[i]).brighten(1)
    let fontcolor = colors.white

    if (chroma.contrast(bgcolor, 'white') < 4.1) {
      fontcolor = colors.black
      hovercolor = chroma(tagcolors[i]).darken(1)
    }

    console.log(`.badge-${ttags[i]} { background-color: ${bgcolor}; color: ${fontcolor}; }`)
    console.log(`.badge-${ttags[i]}:hover { background-color: ${hovercolor}; color: ${fontcolor}; }`)
    console.log(` `)
  }
}

for (let i in colors) {
  const color = colors[i]
  let hovercolor = chroma(color).brighten(1)
  let fontcolor = colors.white
  
  if (chroma.contrast(color, 'white') < 4.1) {
    fontcolor = colors.black
    hovercolor = chroma(color).darken(1)
  }
  
  console.log(`.badge-${i} { background-color: ${color}; color: ${fontcolor}; }`)
  console.log(`.badge-${i}:hover { background-color: ${hovercolor}; color: ${fontcolor}; }`)
  console.log(` `)
}