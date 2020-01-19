// 添加来访记录

// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()


const db = cloud.database()
const vistiRecordCollection = db.collection('visiting-record')
const roomListCollection = db.collection('room-list')
const _ = db.command
const MAX_LIMIT = 100

const funMap = {
    // 创建操作
    create: handleCreate,
    query: handleQuery,
    // queryAll: handleQueryAll,
    update: handleUpdate,
    remove: handleRemove,
    removeAll: handleRemoveAll,
}
const VISIT_TYPE_CODE = {
    reception: 0, // 接待
    raise: 1, // 认筹
    subscription: 2, // 认购
    signing: 3, // 签约
}
const VISTI_TYPE_LIST = [
    VISIT_TYPE_CODE.reception,
    VISIT_TYPE_CODE.raise,
    VISIT_TYPE_CODE.subscription,
    VISIT_TYPE_CODE.signing,
]
const SALE_STATUS = {
    forSale: 1, // 待售
    sold: 2 // 已售
}
const SALE_STATUS_LIST = [
    SALE_STATUS.forSale,
    SALE_STATUS.sold
]
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('event:', event)
  const { operateType, openId } = event

  const operateMap = ['create', 'remove','removeAll', 'update', 'query']
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

    // 传入用户数据
    event['userData'] = authData.result.data && authData.result.data[0] || {}

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
// demo:
// wx.cloud.callFunction({
//     name: 'operateVisitRecord',
//     data: {
//         operateType: 'create',
//         openId: 'xxxx'
//         tel: '133xxxxxxxx',
//         visitPersonName: '张先生',
//         visitTime: '2019/02/02',
//         visitType: 1, //  0 接待，1认筹，2认购，3签约
//         adviser: '张三', // 可选
//         signMoney: '40万', // 签约状态必须填写，其他状态可选
//         visitRooms: [
//             {
//                 buildingId: 'xxxxxxxx',
//                 roomId: 'xxxxxxxxx',
//             }
//         ]
//     }
// })
function handleCreate(event) {
  return new Promise(async (resolve, reject) => {
    const { tel, visitPersonName, visitTime, visitType, adviser, signMoney, visitRooms, userData } = event
    console.log('userData :', userData);
    if (isValidParams([tel, visitPersonName, visitTime, visitType, visitRooms])) return reject('参数不正确')

    if (!VISTI_TYPE_LIST.includes(visitType))  return reject('visitType参数不正确，需整数')
    if (visitType === VISIT_TYPE_CODE.signing && !signMoney) return reject('签约类型，需要填写金额')

    if (!/\d{4}\/\d{2}\/\d{2}/.test(visitTime.toString())) return reject('时间格式需为xxxx/xx/xx')

    if(!Array.isArray(visitRooms))  return reject('visitRooms格式需为数组')

    try {                
        let soldRoomsData = [] // 已售房间列表
        let visitRoomDetails = []
        // 若存在来访房间记录，查询各房间状态，是否已售
        if (visitRooms) {
            for (const roomItem of visitRooms) {
                console.log('roomItem1 :', roomItem);
                let roomData = await roomListCollection.where({
                    buildingId: roomItem.buildingId,
                    _id: roomItem.roomId
                }).get()
                console.log('roomData :', roomData);
                visitRoomDetails.push(roomData.data && roomData.data[0] || {})
                if (roomData.data && +roomData.data.status === SALE_STATUS.sold)
                    soldRoomsData.push(roomData.data[0])
            }
        }
        if (soldRoomsData.length !== 0) return reject(`房间${roomSaleStatus.join(',')}已出售，不应该继续创建来访记录`)

        let hasVisitedData = [] // 一个人当天不可录入同一个来访类别的记录
        if (visitRooms) {
            for (const roomItem of visitRoomDetails) {
                console.log('roomItem2 :', roomItem);
                let visitedData = await vistiRecordCollection.where({
                    tel: roomItem.tel,
                    visitTime: dateFormat(new Date()),
                    roomNumber: roomItem.roomNumber,
                    buildingId: roomItem.buildingId,
                }).get()
                console.log('visitedData :', visitedData)
                if (visitedData.data && visitedData.data.length !== 0)
                    hasVisitedData.push(visitedData.data[0])
            }
        }
        if (hasVisitedData.length !== 0) return reject(`一个人当天不可录入同一个来访类别的记录`)

        // 都不是已售状态，可以录入来访记录
        let addRoomsData = []
        for (const roomItem of visitRoomDetails) {
            let addData = await vistiRecordCollection.add({
                data: {
                    tel,
                    visitPersonName,
                    visitTime,
                    visitType,
                    adviser: adviser || '',
                    signMoney: signMoney || 0,
                    roomNumber: roomItem.roomNumber,
                    roomId: roomItem._id,
                    buildingId: roomItem.buildingId,
                    buildingName: roomItem.buildingName,
                    recordPersonName: userData.userName || '',
                    recordPersonTel: userData.tel || ''
                }
            })
            if (visitType === VISIT_TYPE_CODE.signing) {
                let updateRoomData = await cloud.callFunction({
                    name: 'operateRoom',
                    data: {
                        operateType: 'update',
                        buildingId: roomItem.buildingId,
                        roomId: roomItem._id,
                        soldMoney: signMoney,
                        status: SALE_STATUS.sold
                    }
                })
                console.log('updateRoomData :', updateRoomData)
            }
            addRoomsData.push(addData._id)
        }
        resolve(addRoomsData)
    } catch (e) {
        reject(e)
    }
  })
}
// 查询操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateVisitRecord',
//     data: {
//         operateType: 'query',
//         visitType
//         queryRange: [1,] // 数组， 1 获取当天记录
//         queryRange: [2] // 数组，2获取本周记录
//         queryRange: [10] // 数组，10获取总共记录
// //         queryRange: [1,2,10] // 数组，获取当天，本周，总共记录
            // pageNum: 1,
            // pageSize: 30
//     }
// })

// 因小程序数据库查询一次只能查询 100 条限制
// 该函数封装查询全部操作
function queryAllHelper(collection, whereParam) {
    // 先取出集合记录总数
    const countResult = await collection.count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = collection.where(whereParam).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
      tasks.push(promise)
    }
    let allData = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })
    return allData
}
function handleQuery(event, isQueryAll) {
  return new Promise(async (resolve, reject) => {
    const { queryRange, pageNum, pageSize, isQueryAll, visitType } = event
    const QUERY_TYPE = {
        today: 1,
        week: 2,
        total: 10,
    }
    if (!Array.isArray(queryRange)) return reject('queryRange需是一个数组')
    let whereParam ={};
    if (visitType) whereParam.visitType = visitType-1;
    // if (visitType === 0 || visitType) whereParam.visitType = +visitType;
    try {
        let todayData, weekData, totalData
        if (queryRange.indexOf(QUERY_TYPE.today) > -1) {
            // 查询当天记录
            console.log('dateFormat(new Date()) :', dateFormat(new Date()));
          if (pageSize) {  //分页
            whereParam.visitTime = _.eq(dateFormat(new Date()));
            todayData = await vistiRecordCollection.where(whereParam).orderBy('visitTime', 'desc').skip((pageNum - 1) * pageSize).limit(pageSize).get()
          } else {  //无分页
            // 先取出集合记录总数
            const countResult = await vistiRecordCollection.count()
            const total = countResult.total
            // 计算需分几次取
            const batchTimes = Math.ceil(total / 100)
            const tasks = []
            for (let i = 0; i < batchTimes; i++) {
              const promise = vistiRecordCollection.where({
                visitTime: _.eq(dateFormat(new Date()))
              }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
              tasks.push(promise)
            }
            todayData = (await Promise.all(tasks)).reduce((acc, cur) => {
              return {
                data: acc.data.concat(cur.data),
                errMsg: acc.errMsg,
              }
            })
          }
        }
        if (queryRange.indexOf(QUERY_TYPE.week) > -1) {
            // 查询本周记录 大于等于周一，小于等于周日
          if (pageSize) {  //分页
            whereParam.visitTime = _.gte(weekDay(new Date()).mon).and(_.lte(weekDay(new Date()).sun))
            weekData = await vistiRecordCollection.where(whereParam).orderBy('visitTime', 'desc').skip((pageNum - 1) * pageSize).limit(pageSize).get()
          } else {  //无分页
            // 先取出集合记录总数
            const countResult = await vistiRecordCollection.count()
            const total = countResult.total
            // 计算需分几次取
            const batchTimes = Math.ceil(total / 100)
            const tasks = []
            for (let i = 0; i < batchTimes; i++) {
              const promise = vistiRecordCollection.where({
                visitTime: _.gte(weekDay(new Date()).mon).and(_.lte(weekDay(new Date()).sun))
              }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
              tasks.push(promise)
            }
            weekData = (await Promise.all(tasks)).reduce((acc, cur) => {
              return {
                data: acc.data.concat(cur.data),
                errMsg: acc.errMsg,
              }
            })
          }
     
        }
        if (queryRange.indexOf(QUERY_TYPE.total) > -1) {
            // 查询全部记录
          if (pageSize){  //分页
            totalData = await vistiRecordCollection.where(whereParam).orderBy('visitTime', 'desc').skip((pageNum - 1) * pageSize).limit(pageSize).get()
          }else{  //无分页
            // 先取出集合记录总数
            const countResult = await vistiRecordCollection.count()
            const total = countResult.total
            // 计算需分几次取
            const batchTimes = Math.ceil(total / 100)
            const tasks = []
            for (let i = 0; i < batchTimes; i++) {
              const promise = vistiRecordCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
              tasks.push(promise)
            }
            totalData = (await Promise.all(tasks)).reduce((acc, cur) => {
              return {
                data: acc.data.concat(cur.data),
                errMsg: acc.errMsg,
              }
            })
          }
        }
        console.log('todayData :', todayData);
        console.log('weekData :', weekData);
        console.log('totalData :', totalData);

        let result = {}
        todayData && (result['today'] = todayData.data || [])
        weekData  && (result['week'] = weekData.data || [])
        totalData && (result['total'] = totalData.data || [])
        resolve(result)
    } catch (e) {
        reject(e)
    }
  })
}
// 更新操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateVisitRecord',
//     data: {
//         operateType: 'update',
//         recordId: 'xxxxxxxxxxxx',
//         tel: '133xxxxxxxx',
//         visitPersonName: '张先生',
//         visitTime: '2019/02/02',
//         visitType: 1, //  0 接待，1认筹，2认购，3签约
//         adviser: '张三', // 可选
//         signMoney: '40万', // 签约状态必须填写，其他状态可选
//         visitRoom: {
//             buildingId: 'xxxxxxxx',
//             roomId: 'xxxxxxxxx'
//         }
//     }
// })
function handleUpdate(event) {
  return new Promise(async (resolve, reject) => {
    const { recordId, tel, visitPersonName, visitTime, visitType, adviser, signMoney, visitRoom, userData } = event
    if (isValidParams([recordId, tel, visitPersonName, visitTime, visitType, visitRoom])) return reject('参数不正确')

    if (!VISTI_TYPE_LIST.includes(visitType))  return reject('visitType参数不正确，需整数')
    if (visitType === VISIT_TYPE_CODE.signing && !signMoney) return reject('签约类型，需要填写金额')

    if (!visitTime.toString().test(/\d{4}\/\d{2}\/\d{2}/)) return reject('时间格式需为xxxx/xx/xx')

    try {
        // 已售房间列表
        let roomData = await cloud.callFunction({
            name: 'operateRoom',
            data: {
                operateType: 'query',
                roomId: visitRoom.roomId
            }
        })
        if (roomData.result.data && +roomData.result.data.status === SALE_STATUS.sold)
            return reject(`房间${visitRoom.roomNumber}已出售，不应该继续创建来访记录`)

        let roomDetailsData = roomData.result && roomData.result.data || []
        let addData = await vistiRecordCollection.where({
            _id: recordId
        }).update({
            data: {
                tel,
                visitPersonName,
                visitTime,
                visitType,
                adviser: adviser || '',
                signMoney: signMoney || 0,
                roomNumber: roomDetailsData.roomNumber,
                roomId: roomDetailsData._id,
                buildingId: roomDetailsData.buildingId,
                recordPersonName: userData.userName || '',
                recordPersonTel: userData.tel || ''
            }
        })
        if (visitType === VISIT_TYPE_CODE.signing) {
            await cloud.callFunction({
                name: 'operateRoom',
                data: {
                    operateType: 'update',
                    buildingId: roomDetailsData.buildingId,
                    roomId: roomDetailsData._id,
                    roomNumber: roomDetailsData.roomNumber,
                    soldMoney: signMoney,
                    status: SALE_STATUS.sold
                }
            })
        }
        resolve({
            _id: addData._id
        })
    } catch (e) {
        reject(e)
    }
  })
}
// 删除操作
// demo:
// wx.cloud.callFunction({
//     name: 'operateVisitRecord',
//     data: {
//         operateType: 'remove',
//         recordId: 'xxxxxxxxxxxx'
//     }
// })
function handleRemove(event, isRemoveAll) {
  return new Promise(async (resolve, reject) => {
    const { recordId } = event
    
    if (!isRemoveAll && !recordId) return reject('参数不正确')

    try {
        let result
        if (isRemoveAll) {
            result = await vistiRecordCollection.where({
                _id: _.neq('')
            }).remove()
        } else {
            result = await vistiRecordCollection.where({
                _id: recordId
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
// demo:
// wx.cloud.callFunction({
//     name: 'operateVisitRecord',
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
  return paramsList && paramsList.some(item => item === undefined || item === null)
}
// 计算当周 周一和周日 日期
function weekDay(t) {
    // [1 2 3 4 5 6 0]  日期中 周一到周日代表数字
    let curWeekday = t.getDay()
    if (curWeekday === 0) {
        curWeekday = 7
    }
    console.log('curWeekday :', curWeekday);
    // 星期一日期
    let mon = t.setDate(t.getDate() - (curWeekday - 1))
    // 星期日日期
    let sun = t.setDate(t.getDate() + 6)

    // 格式化成 xxxx/xx/xx
    mon = dateFormat(new Date(mon))
    sun = dateFormat(new Date(sun))
    return {
        mon,
        sun
    }
}
// 日期格式化
function dateFormat(t) {
    return t.getFullYear() + '/' + addZero(t.getMonth() + 1) + '/' + addZero(t.getDate())
}
// 补零
function addZero(n) {
    return n > 9 ? n : '0' + n
}