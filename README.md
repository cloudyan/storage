# storage

缓存工具

## 功能列表

- Storage
- drivers
  - localStorage
  - sessionStorage
  - memory
  - taro
  - uniapp
  - cookie
  - indexedDB

## 版本

- 2.0 支持批量缓存
- 1.0 支持跨端缓存
- 0.2 支持缓存时间控制
- 0.1 支持简单缓存

## 使用

```js
import { Storage } from '@deepjs/storage';

// 精简初始化，仅传入 key 即可
// const storage = new Storage('__global_storage')
const storage = new Storage({
  // driver: 默认自动判断, // 'taro' | 'localStorage' | 'sessionStorage' | 'memory',
  storageKey: '__global_storage', // 用于持久存储 storage 的 Key
  maxAge: 86400*30, // 设置默认缓存时间，等同 {__default: 86400*30}
  // maxAge: { // 传入对象可指定特定数据的缓存时间
  //   __default: 86400*30,
  //   p_s: 3600*4,
  //   p_c: 86400*3650,
  // },
  whiteKeys: [], // 数据白名单，为空则不做限制
  mapKeys: { // 数据冗余
    p_s: 'sessionId',
  },
})


// 缓存单条数据 (0.2 版本支持)
storage.set('p_s', 123, 3600*2)
storage.get('p_s') // 数据过期返回 undefined

// 1.0 版本支持跨端（H5, 小程序）

// 缓存批量数据（2.0 版本支持）
storage.set({ p_s: 456, p_c: '123456'}) // 使用默认的缓存时间
storage.set(
  { p_s: 456, p_c: '123456'},
  3600,  // 当前设置的数据(两条)更新缓存时间为 3600s
)
storage.set(
  { p_s: 456, p_c: '123456'},
  { p_s: 3600*4, p_c: 86400*3650 }, // 更新指定数据的缓存时间
)

storage.get() // 默认取所有数据
storage.get('p_s') // 取 p_s

storage.remove('p_s') // remove 移除缓存，可以传入数组，移除多条缓存
// 也可以用 set 将指定值设置为 undefined

storage.clear() // 清除当前 storage 对应 storageKey 的缓存
```
