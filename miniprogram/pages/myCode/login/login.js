// pages/myCode/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    login:'../../../images/banner.png'
  },
  getUserInfo: function (e) {
    let that = this;
    console.log(e.detail);
    if (e.detail.userInfo == undefined) {
      console.log("user deny")
      return;
    }
  },

  getPhoneNumber: function (e) {
    var that = this;
    console.log(e.detail);
    if (e.detail.errMsg == "getPhoneNumber:ok") {
      console.log(`同意授权手机号码`)
      wx.cloud.callFunction({
        name: 'userManage',
        data: {
          operateType: 'query',
          secretData: wx.cloud.CloudID(e.detail.cloudID)
        },
        success: res => {
          wx.hideLoading();
          console.log(res);
          if (res.result.code == 0) { //有权限
            wx.setStorageSync('openId', res.result.openid);
            wx.setStorageSync('role', res.result.data[0] ? res.result.data[0].role:1);
            wx.reLaunch({
              url: '../index/index',
            });

          } else if (res.result.code == -2){  //无权限
            wx.showToast({
              title: `您没有权限，仅供内部人员使用`,
              icon: 'none',
              duration: 2000
            })
          }else{
            wx.showToast({
              title: `error code: ${res.result.code}`,
              icon: 'none',
              duration: 1000
            })
          }
        },
        fail: err => {
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '调用失败',
          })
          console.error('[云函数] [userManage] templateMessage.send 调用失败：', err)
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})