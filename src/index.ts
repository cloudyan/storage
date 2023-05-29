import miniStorage from './drivers/mini';
import { localStorage, sessionStorage } from './drivers/browser';
import { runtimeEnv, safeJsonStringify, safeJsonParse } from './utils';

// 跨端存储，支持配置缓存时间
type DriverStr = 'memory' | 'localStorage' | 'sessionStorage' | 'taro' | 'mini' //| 'uniapp'
const driverKeys = [
  'memory',
  'browser',
  'taro',
  'mini',
  // 'uniapp',
]

const drivers = {
  localStorage,
  sessionStorage,
  taro: miniStorage,
  memory: null, // 已内置
}

export interface DriverConfig {
  getItem: Function
  setItem: Function
  removeItem: Function
  clear: Function
}

interface StorageConfig {
  driver: DriverConfig
  get: Function
  set: Function
  remove: Function
  clear: Function
}

interface StorageOptions {
  storageKey: string
  driver?: DriverStr | DriverConfig
  size?: number
  maxAge?: number
  name?: string
  version?: number
  description?: string
}


const longMaxAge = 86400*3650
const defaultConfig = {
  name: 'storage',
  description: 'storage 缓存工具',
  // storageKey: '', // __global_storage
  maxAge: longMaxAge, // 默认持久存储
  whiteKeys: [],
  mapKeys: {},
  // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
  // we can use without a prompt.
  // size: 4980736,
  version: 1.0
};

// 单个 key 允许存储的最大数据长度为 1MB，所有数据存储上限为 10MB。

function checkKey(key: string) {
  if (typeof key !== 'string') {
    throw new Error('Storage oper key must be string')
  }
}

type MaxAge = {
  __default: undefined | number;
  [key: string]: undefined | number
}
type CacheData = {
  [key: string]: any
}
function genMaxAgeMap(maxAge: number = longMaxAge, defaultMaxAge?: any): MaxAge{
  if (typeof maxAge === 'number' || typeof maxAge === 'object') {
    if (typeof maxAge === 'number') return {__default: maxAge}
    return Object.assign({}, defaultMaxAge, maxAge)
  } else {
    throw new Error(`maxAge must be number or object`)
  }
}

function wrapDriver(driver: DriverConfig) {
  return Object.assign({
    getItem() {},
    setItem() {},
    removeItem() {},
    clear() {},
  }, driver)
}

function isValidKey(key: string): boolean {
  if (key && typeof key === 'string') return true
  return false
}

export default class Storage implements StorageConfig {
  constructor(options: string | StorageOptions) {
    // 初始化 storageKey
    if (isValidKey(options as string)) options = {storageKey: options} as StorageOptions
    if (!options || (typeof options === 'object' && !isValidKey(options.storageKey))) {
      throw new Error('Storage constructor params must contain storageKey')
    }

    options = Object.assign({}, defaultConfig, options) as StorageOptions

    const { driver, driverType } = getDriver(options.driver)
    this.driver = wrapDriver(driver)
    this.driverType = driverType
    this.storageKey = options.storageKey

    // 数据存储白名单
    const whiteKeys = options.whiteKeys || []
    this.whiteKeys = whiteKeys.length ? (options.whiteKeys || []).reduce((obj, k) => {
      obj[k] = true
      return obj
    }, {}) : null

    // 冗余数据
    this.mapKeys = options.mapKeys || {}

    this.maxAge = genMaxAgeMap(options.maxAge)

    try {
      this.storageData = this.driver.getItem(this.storageKey) || {}
    } catch(err) {
      console.log(err)
    }
  }

  driver: DriverConfig
  storageKey: string
  storageData: any = {}
  maxAge: MaxAge
  driverType = 'memory'
  whiteKeys = null
  mapKeys = {}

  getInfo() {
    console.log('storage info:')
    return {
      maxAge: this.maxAge,
      storageKey: this.storageKey,
      driverType: this.driverType,
      runtimeEnv,
    }
  }

  // 支持批量存取
  set(cacheData: CacheData, maxAge: MaxAge, time: undefined | number) {
    const now = Date.now()
    const defaultMaxAge = this.maxAge

    if (typeof cacheData === 'string') {
      // 单条数据
      const key: string = cacheData
      const value: any = maxAge
      time = time || defaultMaxAge.__default
      cacheData = {[`${key}`]: value}
      maxAge = {[`${key}`]: time} as MaxAge
    }

    maxAge = Object.assign({}, defaultMaxAge, maxAge)

    const whiteKeys = this.whiteKeys
    const result = Object.keys(cacheData).reduce((obj: any, k: string) => {
      const temp: any = cacheData[k]
      const time: number = maxAge[k] || maxAge.__default as number
      if (!whiteKeys || whiteKeys[k]) {
        const value = {
          value: temp,
          timeout: now + time*1000,
        }
        obj[`${k}`] = value
      }
      return obj
    }, {})

    try {
      Object.assign(this.storageData, result)
      this.driver.setItem(this.storageKey, this.storageData)
    } catch(err) {
      console.log(err)
    }
    return this;
  }

  get(key: string) {
    const now = Date.now()
    let updated = false
    const result: any = {}

    const mapKeys = this.mapKeys
    Object.keys(this.storageData || {}).forEach((k) => {
      const temp = this.storageData[k]
      if (temp && typeof temp.value !== 'undefined') {
        if (temp.timeout <= now) {
          delete this.storageData[k]
          updated = true
        } else {
          result[k] = temp.value
          const mapKey = mapKeys[k]
          if (mapKey) {
            result[mapKey] = temp.value
          }
        }
      }
    })
    if (updated) this.driver.setItem(this.storageKey, this.storageData)
    const clone = safeJsonParse(safeJsonStringify(result));

    // 返回副本
    if (key) return clone[key]
    return clone
  }

  remove(key = []) {
    if (typeof key === 'undefined') {
      throw new Error('Storage remove need params key, string or array')
    }

    if (typeof key === 'string') key = [key]

    try {
      key.forEach((k) => {
        delete this.storageData[k]
      })
      this.driver.setItem(this.storageKey, this.storageData)
    } catch (err) {
      console.log(err)
    }
    return this
  }

  clear() {
    try {
      this.storageData = {}
      this.driver.removeItem(this.storageKey)
    } catch (err) {
      console.log(err)
    }
    return this
  }
}

// 只有不配置 或指定 memory 支持跨端
function getDriver(d: undefined | DriverStr | DriverConfig) {
  if (typeof d === 'string' && drivers[d]) {
    return {
      driver: drivers[d],
      driverType: d,
    }
  }

  // 未定义则根据环境自动判断
  let driver
  let driverType = 'memory'
  if (runtimeEnv.miniStorage) {
    driver = miniStorage
    driverType = runtimeEnv.miniType
  } else if (runtimeEnv.localStorage) {
    driver = localStorage
    driverType = 'localStorage'
  }
  return {
    driver,
    driverType,
  }
}
