// @ts-ignore
// import Taro from '@tarojs/taro'
import { mini } from '../utils.js'

// mini.getStorageSync
// mini.setStorageSync
// mini.removeStorageSync
// mini.clearStorageSync

const miniStorage = {
  getItem(key) {
    try {
      return mini.getStorageSync(key) || {}
    } catch (err) {
      console.log(err)
      return {}
    }
  },
  setItem(key, data) {
    try {
      mini.setStorageSync(key, data)
    } catch(err) {
      console.log(err)
    }
  },
  removeItem(key) {
    if (!key) return;
    try {
      mini.removeStorageSync(key)
    } catch(err) {
      console.log(err)
    }
  },
  // clear() {
  //   try {
  //     mini.clearStorageSync()
  //   } catch(err) {
  //     console.log(err)
  //   }
  // },
}

export default miniStorage
