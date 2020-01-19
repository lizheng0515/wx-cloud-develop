// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const roomListCollection = db.collection('room-list')
const buildingsCollection = db.collection('buildings')
const _ = db.command

const MAX_LIMIT = 100

const funMap = {
  // 创建操作
  create: handleCreate,
  query: handleQuery,
  queryAll: handleQueryAll,
  update: handleUpdate,
  remove: handleRemove,
  removeAll: handleRemoveAll,
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('event:', event)
  const { operateType, openId } = event

  const operateMap = ['create', 'remove', 'removeAll', 'update', 'query', 'queryAll']
  if (operateMap.indexOf(operateType) === -1) {
    return {
      code: 404,
      data: `没有${operateType}操作类型`
    }
  }
  
  try {
    let authData = await cloud.callFunction({
        name: 'auth',
        data: {
            openId
        }
    })
    console.log('authData :', authData)
    if (!authData.result || authData.result.code !== 0) {
        return authData.result
    }

    const data = await funMap[operateType](event)

    const wxContext = cloud.getWXContext()

    return {
      code: 0,
      data,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  } catch (e) {
    return {
      code: 404,
      data: e
    }
  }
}

// 创建操作
// demo：
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'create',
//         buildingId: 'xxxxxxxxxxx',
//         roomNumber: '101',
//         soldMoney: '', // 可选
//         status: 1 // 1待售 2已售
//     }
// })
function handleCreate(event) {
  return new Promise(async (resolve, reject) => {
    const { buildingId, roomNumber, soldMoney, status } = event
    if (isValidParams([buildingId, roomNumber, status])) return reject('参数不正确')

    try {
      // 先查询是否存在楼栋
    //   const buildingData = await cloud.callFunction({
    //     name: 'operateBuilding',
    //     data: {
    //       operateType: 'query',
    //       buildingId
    //     }
    //   })
    //   console.log('buildingData,', buildingData)
    //   if (buildingData.result.data.length === 0) {
    //     return reject('不存在该栋楼')
    //   }
      
      // 查询是否存在重名
      const uniqueRoomNumberData = await roomListCollection.where({
        buildingId,
        roomNumber
      }).get()
      console.log('uniqueRoomNumberData,', uniqueRoomNumberData)
      if (uniqueRoomNumberData.data && uniqueRoomNumberData.data.length >= 1) {
        return reject('该栋楼已存在该房间名')
      }

      const buildData = await cloud.callFunction({
          name: 'operateBuilding',
          data: {
              operateType: 'query',
              buildingId
          }
      })
      console.log('buildData :', buildData);

      const result = await roomListCollection.add({
        data: {
          buildingName: buildData.result && buildData.result.data && buildData.result.data.buildingName || '',
          buildingId,
          roomNumber,
          soldMoney: soldMoney || '',
          status: +status // 转换成整数
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
// demo：
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'query',
//         roomId: 'xxxxxxxxxxx'
//     }
// })
function handleQuery(event, isQueryAll) {
  return new Promise(async (resolve, reject) => {
    const { roomId, buildingId } = event
    if (!isQueryAll && !roomId) {
      return reject('参数不正确')
    }

    try {
      let result = {}
      if (isQueryAll) {
        let queryParams = {
            _id: _.neq('')
        }
        if (buildingId) {
            queryParams['buildingId'] = buildingId
        }
        // 先取出集合记录总数
        const countResult = await roomListCollection.count()
        const total = countResult.total
        // 计算需分几次取
        const batchTimes = Math.ceil(total / 100)
        // 承载所有读操作的 promise 的数组
        const tasks = []
        for (let i = 0; i < batchTimes; i++) {
            const promise = roomListCollection.where(queryParams).orderBy('roomNumber', 'asc').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
            tasks.push(promise)
        }
        result = (await Promise.all(tasks)).reduce((acc, cur) => {
            return {
              data: acc.data.concat(cur.data),
              errMsg: acc.errMsg,
            }
        })
        // console.log('result :', result);
        if (!buildingId) {
            let finalRoom = {}
            buildData = await buildingsCollection.get()
            // console.log('buildData :', buildData);
            buildData.data.forEach(buildItem => {
                finalRoom[buildItem.buildingName] = []
                result.data.forEach(roomItem => {
                    if (buildItem.buildingName === roomItem.buildingName) {
                        finalRoom[buildItem.buildingName].push(roomItem)
                    }
                })
            })
            // console.log('finalRoom :', finalRoom);
            return resolve(finalRoom)
        }
      } else {
        result = await roomListCollection.where({
          _id: roomId
        }).get()
    }
    // console.log('result :', result);
      resolve(result.data)
    } catch (e) {
      reject(e)
    }
  })
}
// 查询一栋楼内全部房间操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'queryAll',
//         buildingId: 'xxxxxxxxxxx'
//     }
// })
// 查询全部房间操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'queryAll'
//     }
// })
function handleQueryAll(event) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await handleQuery(event, true)
      resolve(result)
    } catch (e) {
      reject(e)
    }
  })
}
// 更新操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'update',
//         buildingId: 'xxxxxxxxxxx',
//         roomId: 'xxxxxxxxxxx',
//         roomNumber: '101', // 不可同名。如果同名，则不用携带，如果不同名，可以携带该参数
//         soldMoney: '', // 可选
//         status: 1
//     }
// })
function handleUpdate(event) {
  return new Promise(async (resolve, reject) => {
    const { roomId, roomNumber, soldMoney, status, buildingId } = event
    if (isValidParams([roomId, status, buildingId])) return reject('参数不正确')

    try {
      // 查询是否存在重名
      if (roomNumber) {
          const uniqueRoomNumberData = await roomListCollection.where({
            buildingId,
            roomNumber
          }).get()
          console.log('uniqueRoomNumberData,', uniqueRoomNumberData)
          if (uniqueRoomNumberData.data && uniqueRoomNumberData.data.length >= 1) {
            return reject('该栋楼已存在该房间名')
          }          
      }

      const buildData = await cloud.callFunction({
        name: 'operateBuilding',
        data: {
            operateType: 'query',
            buildingId
        }
      })
      console.log('buildData :', buildData);

      let updateParam = {
        roomNumber,
        status: +status // 转换成整数
      }
      let buildingName = buildData.result && buildData.result.data && buildData.result.data.buildingName
      if (buildingName) {
        updateParam['buildingName'] = buildingName
      }
      if (roomNumber) {
        updateParam['roomNumber'] = roomNumber
      }
      if (soldMoney) {
        updateParam['soldMoney'] = soldMoney
      }
      const result = await roomListCollection.where({
        _id: roomId
      }).update({
        data: updateParam
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
// demo:
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'remove',
//         roomId: 'xxxxxxxxxxx'
//     }
// })
function handleRemove(event, isRemoveAll) {
  return new Promise(async (resolve, reject) => {
    const { roomId, buildingId } = event
    
    if (!isRemoveAll && !roomId) return reject('参数不正确')

    try {
        let result
        if (isRemoveAll) {
            let queryParams = {
                _id: _.neq('')
            }
            if (buildingId) {
                queryParams['buildingId'] = buildingId
            }
            result = await roomListCollection.where(queryParams).remove()
        } else {
            result = await roomListCollection.where({
                _id: roomId
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
// 删除一栋楼内的全部房间操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateRoom',
//     data: {
//         operateType: 'removeAll',
//         buildingId: 'xxxxxxxxxxx'
//     }
// })
// 删除全部操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateRoom',
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
// 判断是否参数为 undefined 或者 null 或者 ''
function isValidParams(paramsList) {
  return paramsList && paramsList.some(item => item === undefined || item === null || item === '')
}