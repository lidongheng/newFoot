const axios = require('axios')

function bubbleSort (Arr, params) {
  // 根据对象数组的attr的值由小到大排序
  if (Arr.length === 0) return []
  function swap (Arr, p, q) {
    let temp;
    temp = Arr[p]
    Arr[p] = Arr[q]
    Arr[q] = temp
  }
  for (var i = 0; i < Arr.length; i++) {
    for (var j = i; j < Arr.length; j++) {
      if (Arr[i][params] > Arr[j][params]) {
        swap(Arr, i, j)
      }
    }
  }
  return Arr
}

function bubbleSort2 (Arr, params, f = false) {
  if (Arr.length === 0) return []
  function swap (Arr, p, q) {
    let temp;
    temp = Arr[p]
    Arr[p] = Arr[q]
    Arr[q] = temp
  }
  for (var i = 0; i < Arr.length; i++) {
    for (var j = i; j < Arr.length; j++) {
      if (Arr[i][params] < Arr[j][params]) {
        swap(Arr, i, j)
      }
    }
  }
  if (f) {
    // 新创建个临时数组，先塞外援，再塞内援
    const tempArr = []
    for (let i = 0; i < Arr.length; i++) {
      if (Arr[i].isForeign && Arr[i].isForeign === 1) {
        tempArr.push(Arr[i])
      }
    }
    for (let i = 0; i < Arr.length; i++) {
      if (!Arr[i].isForeign) {
        tempArr.push(Arr[i])
      }
    }
    return tempArr
  } else {
    return Arr
  }
}

function dateFormat (date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) {
    return ''
  }
  if (typeof date === 'string') {
    date = new Date(date.replace(/-/g, '/'))
  }
  if (typeof date === 'number') {
    date = new Date(date)
  }
  var o = {
    'M+': date.getMonth() + 1,
    'D+': date.getDate(),
    'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds()
  }
  var week = {
    0: '\u65e5',
    1: '\u4e00',
    2: '\u4e8c',
    3: '\u4e09',
    4: '\u56db',
    5: '\u4e94',
    6: '\u516d'
  }
  if (/(Y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (RegExp.$1.length > 1 ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[date.getDay() + '']
    )
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return fmt
}

function getWeekDay (date) {
  console.log(date)
  if (!date) {
    return ''
  }
  if (typeof date === 'string') {
    date = new Date(date.replace(/-/g, '/'))
  }
  if (typeof date === 'number') {
    date = new Date(date)
  }
  const weekNum = date.getDay()
  let week = ''
  switch (weekNum) {
    case 0:
      week = '周日'
      break
    case 1:
      week = '周一'
      break
    case 2:
      week = '周二'
      break
    case 3:
      week = '周三'
      break
    case 4:
      week = '周四'
      break
    case 5:
      week = '周五'
      break
    case 6:
      week = '周六'
      break
  }
  return week
}

function deepClone (target, map = new WeakMap()) {
  if (target == null) return null
  if (target instanceof Date) return new Date(target)
  if (target instanceof RegExp) return new RegExp(target)
  if (typeof target !== 'object') return target
  let cloneTarget = new target.constructor
  if (map.get(target)) return target
  map.set(target, cloneTarget)
  for (let key in target) {
    if (target.hasOwnProperty(key)) {
      if (target[key] && typeof target[key] === 'object') {
        cloneTarget[key] = deepClone(target[key], map)
      } else {
        cloneTarget[key] = target[key]
      }
    }
  }
  return cloneTarget
}

function findMostValOfArr (Arr) {
  let serialObj = {}
  for (let key in Arr) {
    if (serialObj.hasOwnProperty(key)) {
      serialObj[key] += 1
    } else {
      serialObj[key] = 1
    }
  }
  let temp = 0,max = 0
  for (let key in serialObj) {
    if (serialObj[key] > max) {
      max = serialObj[key]
      temp = key
    }
  }
  return temp
}

class Queue {
  constructor (arr) {
    if (arr) {
      this.items = [arr]
    } else if (Array.isArray(arr)) {
      this.items = arr
    } else {
      this.items = []
    }
  }

  enqueue = element => {
    this.items.push(element)
  }

  dequeue = () => {
    return this.items.shift()
  }

  front = () => {
    return this.items[0]
  }

  isEmpty = () => {
    return this.items.length === 0
  }

  size = () => {
    return this.items.length
  }

  toString = () => {
    let resultString = ''
    for (let i of this.items){
      resultString += i + ' '
    }
    return resultString
  }

  toArray = () => {
    return this.items
  }
}

const service = axios.create({
  timeout: 10000,
  retry: 4,
  retryDelay: 1000
})

service.interceptors.request.use(config => {
  console.log(new Date())
  config.headers['Accept'] = '*/*'
  config.headers['Accept-Encoding'] = 'gzip, deflate'
  config.headers['Accept-Language'] = 'zh-CN,zh;q=0.9'
  config.headers['Connection'] = 'keep-alive'
  config.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36'
  config.headers['Cookie'] = `Hm_lvt_5ee25051f2fb71cfbf0bfa5bbd459b6f=${Date.parse(new Date())/1000 - 9}; Hm_lpvt_5ee25051f2fb71cfbf0bfa5bbd459b6f=${Date.parse(new Date())/1000}`
  return config
}, (err) => {
  Promise.reject(err)
})

service.interceptors.response.use(res => {
  if (res.status == 200) {
    return res
  }
},function axiosRetryInterceptor(err) {
  // console.log('出错', err.config)
  var config = err.config
  // If config does not exist or the retry option is not set, reject
  if (!config || !config.retry) return Promise.reject(err)

  // Set the variable for keeping track of the retry count
  config.__retryCount = config.__retryCount || 0

  // Check if we've maxed out the total number of retries
  if (config.__retryCount >= config.retry) {
      // Reject with the error
      return Promise.reject(err)
  }

  // Increase the retry count
  config.__retryCount += 1

  // Create new promise to handle exponential backoff
  var backoff = new Promise(function (resolve) {
      setTimeout(function () {
          resolve()
      }, config.retryDelay || 1)
  })

  // Return the promise in which recalls axios to retry the request
  return backoff.then(function () {
      return service(config)
  })
})

module.exports = {
  dateFormat,
  Queue,
  service,
  bubbleSort,
  bubbleSort2,
  deepClone,
  findMostValOfArr,
  getWeekDay
}