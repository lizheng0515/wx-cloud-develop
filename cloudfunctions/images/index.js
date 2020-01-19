// 云函数入口文件
const fs = require('fs')
const path = require('path')
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const imagesCollection = db.collection('images')
const _ = db.command

const funMap = {
  // 创建操作
  create: handleCreate,
  query: handleQuery,
//   queryAll: handleQueryAll,
//   update: handleUpdate,
//   remove: handleRemove,
//   removeAll: handleRemoveAll,
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('event:', event)
  const { operateType, openId } = event

//   const operateMap = ['create', 'remove', 'removeAll', 'update', 'query', 'queryAll']
  const operateMap = ['create', 'query']
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
//     name: 'images',
//     data: {
//         operateType: 'create',
//         namespace: 'banner', // 命名空间
//         imgUrl: 'xxxx'
//     }
// })
function handleCreate(event) {
  return new Promise(async (resolve, reject) => {
    const { imgUrl, namespace } = event
    if (!imgUrl || !namespace) return reject('参数不正确')

    try {
        let imgPath = path.join(__dirname, '../../miniprogram/images/', imgUrl)
        console.log('imgPath :', imgPath);
        const fileStream = fs.createReadStream(imgPath)
        // console.log('fileStream :', fileStream);
        let uploadData = await cloud.uploadFile({
            cloudPath: imgUrl,
            fileContent: fileStream,
        })
        console.log('uploadData :', uploadData)

        let imgData = await imagesCollection.add({
            data: {
                namespace,
                fileID: uploadData.fileID
            }
        })
        console.log('imgData :', imgData)

      resolve(imgData)
    } catch (e) {
      reject(e)
    }
  })
}
// 查询操作
// demo:
// wx.cloud.callFunction({
//     name: 'images',
//     data: {
//         operateType: 'query',
//         namespace: 'banner'
//     }
// })
function handleQuery(event, isQueryAll) {
  return new Promise(async (resolve, reject) => {
    const { namespace } = event
    if (!isQueryAll && !namespace) return reject('参数不正确')

    try {
      let imagesData = {}
      if (isQueryAll) {
        imagesData = await imagesCollection.get()
      } else {
        imagesData = await imagesCollection.where({
            namespace
        }).get()
      }
      if (imagesData.data && imagesData.data.length !== 0) {
          let fileList = []
          imagesData.data.forEach(item => {
            fileList.push(item.fileID)
          })
          const result = await cloud.getTempFileURL({
            fileList,
          })
            console.log('getTempFileURL>>>result :', result);
            return resolve(result.fileList)
      }
      console.log('imagesData :', imagesData);
      resolve(imagesData.data)
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