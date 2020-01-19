// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const userListCollection = db.collection('user-list')
const _ = db.command

const ROLE_TYPE = {
    normal: 1, // 普通
    manager: 2, // 管理员
    superManager: 10 // 超级管理员
}

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
  const { operateType, openId, secretData } = event

  const operateMap = ['create', 'remove', 'removeAll', 'update', 'query', 'queryAll']
  if (operateMap.indexOf(operateType) === -1) {
    return {
        code: 404,
        data: `没有${operateType}操作类型`
    }
  }
  const wxContext = cloud.getWXContext()

  try {
    //   除了查询操作，其他操作都需要验证权限
    let params = {
        OPENID: wxContext.OPENID
    }
    if (secretData) {
        params['secretData'] = secretData
    }
    if (openId) {
        params['openId'] = openId
    }
    let authData = await cloud.callFunction({
        name: 'auth',
        data: params
    })
    console.log('authData :', authData)
    if (!authData.result || authData.result.code !== 0) {
        return authData.result
    }

    const data = await funMap[operateType](event)
    
    return {
      code: 0,
      data,
      openid: wxContext.OPENID, // openId 是用户在当前公众号下的唯一标识，多个公众号，有多个 openId
      appid: wxContext.APPID, // appid 是小程序的 id
      // 开发者拥有多个移动应用、网站应用和公众帐号，可通过获取用户基本信息中的 unionid 来区分用户的唯一性
      // unionid 是对应同一家主体的唯一 id，区别于公众号，
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
// demo：
// wx.cloud.callFunction({
//     name: 'userManage',
//     data: {
//         operateType: 'create',
//         role: ROLE_TYPE.normal, // 权限
//         tel: 'xxxxxxxx',
//         userName: '张三'
//     }
// })
function handleCreate(event) {
  return new Promise(async (resolve, reject) => {
    const { role, tel, userName } = event
    if (isValidParams([role, tel, userName])) return reject('参数不正确')

    try {
      const uniUserData = await userListCollection.where({
        tel
      }).get()
      console.log('uniUserData,', uniUserData)
      if (uniUserData.data && uniUserData.data.length >= 1) {
        return reject('已存在该用户')
      }

      const userData = await userListCollection.add({
        data: {
            role,
            userName,
            tel
        }
      }).get()
      console.log('userData,', userData)
      resolve({
        id: userData._id
      })
    } catch (e) {
      reject(e)
    }
  })
}
// 查询操作
// demo:
// 初次登录调用
// wx.cloud.callFunction({
//     name: 'userManage',
//     data: {
//         operateType: 'query',
//         secretData: wx.cloud.CloudID('xxx') // 填写拿到的 CloudID
//     }
// })
// 第二次使用返回的 openid 调用
// wx.cloud.callFunction({
//     name: 'userManage',
//     data: {
//         operateType: 'query',
//         openId: 'xxxxxxxx'
//     }
// })
function handleQuery(event, isQueryAll) {
  return new Promise(async (resolve, reject) => {
    const { openId, secretData } = event
    console.log('event :', event);
    if (!secretData && !isQueryAll && !openId) return reject('参数不正确')

    try {
      let result = {}
      if (isQueryAll) {
        result = await userListCollection.get()
      } else {
          let params = {}
          if (secretData) {
            params['tel'] = secretData.data.purePhoneNumber
          }
          if (openId) {
            params['openId'] = openId
          }
            result = await userListCollection.where(params).get()
      }
      console.log('result :', result)
      resolve(result.data)
    } catch (e) {
      reject(e)
    }
  })
}
// 查询全部操作
// demo：
// wx.cloud.callFunction({
//     name: 'userManage',
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
//     name: 'userManage',
//     data: {
//         operateType: 'update',
//         openId: 'xxxxxxxx',
//         role: ROLE_TYPE.normal, // 权限
//         userName: '张三',
//         tel: '133xxxxxxxx'
//     }
// })
function handleUpdate(event) {
  return new Promise(async (resolve, reject) => {
    const { role, openId, userName, tel } = event
    if (isValidParams([role, openId, userName, tel])) return reject('参数不正确')

    try {
      const result = await userListCollection.where({
        openId
      }).update({
        data: {
            role, // 权限
            userName,
            tel
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
//     name: 'userManage',
//     data: {
//         operateType: 'remove',
//         openId: 'xxxxxxxx'
//     }
// })
function handleRemove(event, isRemoveAll) {
  return new Promise(async (resolve, reject) => {
    const { openId } = event
    if (!isRemoveAll && !openId) return reject('参数不正确')

    try {
      let result
        if (isRemoveAll) {
            result = await userListCollection.where({
                _id: _.neq('')
            }).remove()
        } else {
            result = await userListCollection.where({
                openId
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
//     name: 'userManage',
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