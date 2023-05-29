import { safeJsonStringify, safeJsonParse } from '../utils.js'

let win = {
  sessionStorage: {},
  localStorage: {},
};
if (typeof window !== 'undefined') {
  win = window;
}

function genWebStorage(type) {
  const webStorage = win[type] || win.localStorage
  return {
    getItem(key) {
      try {
        return safeJsonParse(webStorage.getItem(key)) || {}
      } catch (err) {
        return {}
      }
    },
    setItem(key, data) {
      try {
        webStorage.setItem(key, safeJsonStringify(data))
      } catch(err) {
        console.log(err)
      }
    },
    removeItem(key) {
      if (!key) return;
      try {
        webStorage.removeItem(key)
      } catch(err) {
        console.log(err)
      }
    },
    // clear() {
    //   try {
    //     webStorage.clear()
    //   } catch(err) {
    //     console.log(err)
    //   }
    // },
  }
}
export const localStorage = genWebStorage('localStorage')
export const sessionStorage = genWebStorage('sessionStorage')
export default {
  localStorage,
  sessionStorage,
}
