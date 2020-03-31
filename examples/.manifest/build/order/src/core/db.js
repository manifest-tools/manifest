

exports.delay = n => new Promise(resolve => {
  setTimeout(() => resolve(), n)
})
