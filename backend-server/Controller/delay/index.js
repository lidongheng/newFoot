function delay (fn, time) {
  return new Promise((resolve, rejected) => {
    setTimeout(() => {
      fn && resolve(fn())
    }, time * 1000)
  })
}

module.exports = {
  delay
}