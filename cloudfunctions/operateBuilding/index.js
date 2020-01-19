// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
// 获取数据库引用
const db = cloud.database()
// 获取buildings 集合
const buildingsCollection = db.collection('buildings')
// 获取数据库操作符
const _ = db.command

const funMap = {
  create: handleCreate,     //增
  query: handleQuery,       //查
  queryAll: handleQueryAll,
  update: handleUpdate,     //改
  remove: handleRemove,     //删
  removeAll: handleRemoveAll,
}

// 云函数入口函数
exports.main = async (event, context) => {
  // console.log('event:', event)
  const { operateType, openId } = event
  const operateMap = ['create', 'remove', 'removeAll', 'update', 'query', 'queryAll']
  if (operateMap.indexOf(operateType) === -1) {
    return {
        code: 404,
        data: `没有${operateType}操作类型`
    }
  }
  try {
    //校验登录
    let authData = await cloud.callFunction({
        name: 'auth',
        data: {
            openId
        }
    })
    if (!authData.result || authData.result.code !== 0) {
        return authData.result
    }
    //异步调用
    const data = await funMap[operateType](event)
    const wxContext = cloud.getWXContext()
    return {
      code: 0,
      data,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  } catch(e) {
    return {
      code: 404,
      data: e
    }
  }
}

// 创建操作
// 调用demo：
// wx.cloud.callFunction({
//     name: 'operateBuilding',
//     data: {
//         operateType: 'create',
//         buildingName: '1号楼'
//     },
//     success: res => {}
// })

function handleCreate(event) {
  return new Promise(async (resolve, reject) => {
    const { buildingName } = event
    if (!buildingName) return reject('参数不正确')

    try {
      const buildingData = await buildingsCollection.where({
        buildingName
      }).get()
      console.log('buildingData,', buildingData)
      if (buildingData.data && buildingData.data.length >= 1) {
        return reject('已存在该栋楼号')
      }

      const result = await buildingsCollection.add({
        data: {
          buildingName
        }
      })
      resolve({
        id: result._id
      })
    } catch (e) {
      reject(e)
    }
  })
}
// 查询操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateBuilding',
//     data: {
//         operateType: 'query',
//         buildingId: 'xxxxxxxxxxxxxxxxxx'
//     }
// })
function handleQuery(event, isQueryAll) {
  return new Promise(async (resolve, reject) => {
    const { buildingId } = event
    if (!isQueryAll && !buildingId) return reject('参数不正确')

    try {
      let result = {}
      if (isQueryAll) {
        result = await buildingsCollection.get()
      } else {
        result = await buildingsCollection.where({
          _id: buildingId
        }).get()
      }
      console.log('result :', result);
      resolve(result.data)
    } catch (e) {
      reject(e)
    }
  })
}
// 查询全部操作
// demo：
// wx.cloud.callFunction({
//     name: 'operateBuilding',
//     data: {
//         operateType: 'queryAll'
//     }
// })
function handleQueryAll() {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await handleQuery({}, true)
      resolve(result)
    } catch(e) {
      reject(e)
    }
  })
}
// 更新操作
// demo：
// wx.cloud.callFunction({
//     name: 'operateBuilding',
//     data: {
//         operateType: 'update',
//         buildingId: 'xxxxxxxxxxx',
//         buildingName: '1号楼'
//     }
// })
function handleUpdate(event) {
  return new Promise(async (resolve, reject) => {
    const { buildingId, buildingName } = event
    if (!buildingId || !buildingName) return reject('参数不正确')

    try {
      // 查询是否存在重名
      const uniqueBuildingData = await buildingsCollection.where({
        _id: buildingId,
        buildingName
      }).get()
      console.log('uniqueBuildingData,', uniqueBuildingData)
      if (uniqueBuildingData.data && uniqueBuildingData.data.length >= 1) {
        return reject('已存在该栋楼号')
      }

      const result = await buildingsCollection.where({
        _id: buildingId
      }).update({
        data: {
          buildingName
        }
      })
      resolve({
          updated: result.stats.updated
      }) 
    } catch (e) {
      reject(e)
    }
  })
}
// 删除操作
// demo：
// wx.cloud.callFunction({
//     name: 'operateBuilding',
//     data: {
//         operateType: 'remove',
//         buildingId: 'xxxxxxxxxxx'
//     }
// })
function handleRemove(event, isRemoveAll) {
  return new Promise(async (resolve, reject) => {
    const { buildingId } = event
    if (!isRemoveAll && !buildingId) return reject('参数不正确')

    try {
      let result
        if (isRemoveAll) {
            result = await buildingsCollection.where({
                _id: _.neq('')
            }).remove()
        } else {
            result = await buildingsCollection.where({
                _id: buildingId
            }).remove()
        }
      resolve({
        removed: result.stats.removed
      })
    } catch (e) {
      reject(e)
    }
  })
}
// 删除全部操作
// demo：
// wx.cloud.callFunction({
//     name: 'operateBuilding',
//     data: {
//         operateType: 'removeAll'
//     }
// })
function handleRemoveAll(event) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await handleRemove({}, true)
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })
}