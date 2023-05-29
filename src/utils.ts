
export function safeJsonStringify(obj = {}) {
  if (typeof obj !== 'object') {
    console.log('Storage muse be cache JSON obj')
  }
  try {
    return JSON.stringify(obj)
  } catch(err) {
    console.log(err)
  }
  return '{}'
}
export function safeJsonParse(str: string = '{}') {
  try {
    return JSON.parse(str)
  } catch(err) {
    console.log(err)
  }
  return {}
}

function getGlobal() {
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw new Error('unable to locate global object');
}

const globals = getGlobal() || {};
const env = {}

// 无论是 taro
export const mini = globals.Taro || globals.wx

env.global = mini || globals;

if (globals.wx) {
  env.weapp = true
  env.miniType = 'weapp'
}
if (globals.Taro) {
  env.taro = true
  env.miniType = 'taro'
}

if (mini) {
  if (typeof mini.getStorageSync === 'function') {
    env.miniStorage = true
  } else {
    console.log(new Error('current env is not wx or Taro'))
  }
}

if (typeof globals.localStorage === 'object' && typeof globals.localStorage.getItem === 'function') {
  env.localStorage = true
}
if (typeof globals.sessionStorage === 'object' && typeof globals.sessionStorage.getItem === 'function') {
  env.sessionStorage = true
}

// console.log('runtimeEnv', env);

export const runtimeEnv = env;
