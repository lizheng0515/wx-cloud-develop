// pages/myCode/buildSales/buildSales.js
const cloudApi = require('../../../utils/cloudApi.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    buildNums: [{ buildingName:'',_id:0}],
  },
  goBuildDetail: function (event) {
    let id = event.currentTarget.dataset.id;
    let name = event.currentTarget.dataset.name;
    // 防止两次点击操作间隔太快
    let nowTime = new Date();
    if (nowTime - this.data.tapTime < 1000) {
      return;
    }
    this.setData({
      'tapTime': nowTime
    });
    wx.navigateTo({
      url: '../buildDetail/buildDetail?id=' + id +'&name='+name,
    });
  },
  //预览图片
  previewImg: function (e) {
    var currentUrl = e.currentTarget.dataset.currenturl
    var previewUrls = e.currentTarget.dataset.previewurl
    wx.previewImage({
      current: currentUrl, //必须是http图片，本地图片无效
      urls: previewUrls, //必须是http图片，本地图片无效
    })
  },

  queryAllBuild() {
    let _that = this;
    wx.showLoading({
      title: '加载中',
    })
    cloudApi.cloudRequest({
      name: 'operateBuilding',
      data: {
        operateType: 'queryAll',
      },
      success: res => {
        if (res.result.data) {
          _that.setData({
            'buildNums': res.result.data
          });
        } else {
          wx.showToast({
            title: `服务器故障，获取数据失败`,
            icon: 'none',
            duration: 1000
          })
        }
      },
    })

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    var picList = []
    picList.push("https://6c69-lizheng-env-id-1301019994.tcb.qcloud.la/build_1.png?sign=6a9d21f04e730e0838d2ac7e6123363a&t=1578290678")
    picList.push("https://6c69-lizheng-env-id-1301019994.tcb.qcloud.la/build_2.png?sign=a0557bb5f244e7fcc6d86d272fdc8821&t=1578290638")
    picList.push("https://6c69-lizheng-env-id-1301019994.tcb.qcloud.la/build_3.png?sign=1d1e610fb8b8f1d9aa1f133d8d3bcfc0&t=1578290650")
    that.setData({
      picList: picList,
    })
    this.queryAllBuild();
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