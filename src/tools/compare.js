module.exports = (a, b) => {
  const createdA = a.created_at
  const createdB = b.created_at

  let comparison = 0

  if (createdA > createdB) {
    comparison = 1
  } else if (createdA < createdB) {
    comparison = -1
  }
  return comparison * -1
}