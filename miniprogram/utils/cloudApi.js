/**
 * 调用云函数封装
 * @method cloudRequest
 * @param {name:'',data:{},callback:function} 
 * @return {callback} params.success
 */
function cloudRequest(params){
  wx.getStorage({
    key: 'openId',
    success(resStorage) {
      // console.log(`openId ==> : ${resStorage.data}`);
      wx.showLoading({
        title: '加载中',
      })
      params.data.openId = resStorage.data;//添加openId
      wx.cloud.callFunction({
        name: params.name,
        data: params.data,
        success: res => {
          wx.hideLoading();
          if (res.result && res.result.code == 0 && params.success) { //成功
            params.success(res);
          } else if (res.result && res.result.code == -1){  //未登录
            wx.showToast({
              title: `未登录`,
              icon: 'none',
              duration: 1000
            });
            setTimeout(()=>{
              wx.reLaunch({
                url: '../login/login',
              });
            },1000)
         
          } else if (res.result && res.result.code == -2) {  //仅供内部人员使用
            wx.showToast({
              title: `您没有权限，仅供内部人员使用`,
              icon: 'none',
              duration: 1500
            })
            wx.reLaunch({
              url: '../login/login',
            });
          } else {  //错误状态码
            wx.showToast({
              title: `error code : ${res.result.data ? res.result.data : res.result.code}`,
              icon: 'none',
              duration: 1500
            })
          }
        },
        fail: err => {  //调用失败
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '调用失败',
          })
          console.error(`[云函数] [${params.name}] templateMessage.send err: ${err}`);
          if (params.fail) { params.fail(err) }
        }
      })

    },
    fail: err => {
      wx.clearStorage();
      wx.reLaunch({
        url: '../login/login',
      });
    }
  })
}


module.exports = {
  cloudRequest: cloudRequest,
}