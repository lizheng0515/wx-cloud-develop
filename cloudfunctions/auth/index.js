// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const userListCollection = db.collection('user-list')
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('event:', event)
  const { openId, secretData, OPENID } = event
  if (!secretData && !openId) {
    return {
      code: -1,
      data: '未登录'
    }
  }
  try {
    // 验证权限
    let userData = {}
    if (secretData) {
        userData = await userListCollection.where({
            tel: secretData.data.purePhoneNumber
        }).get()
        console.log('userData :', userData);

        if (userData.data && userData.data.length !== 0 && !userData.data.openId) {
            // 不存在 openId ，则加入
            console.log('secretData :', secretData);
            let updateUserData = await userListCollection.where({
                tel: secretData.data.purePhoneNumber
            }).update({
                data: {
                    openId: OPENID
                }
            })
            console.log('updateUserData :', updateUserData)
        } else if (!userData.data || userData.data.length === 0) {
            return {
                code: -2,
                data: '没有权限'
            }
        }
    } else {
        userData = await userListCollection.where({
            openId
        }).get()
        
        console.log('userData :', userData)
        if (!userData.data || userData.data.length === 0) {
            return {
                code: -2,
                data: '没有权限'
            }
        }
    }
    const wxContext = cloud.getWXContext()

    return {
      code: 0,
      data: userData.data || [],
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
