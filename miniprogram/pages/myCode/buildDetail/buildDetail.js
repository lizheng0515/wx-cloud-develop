// pages/myCode/buildDetail/buildDetail.js
const cloudApi = require('../../../utils/cloudApi.js');

Page({

  /**
   * 页面的初始数据   1 待售 2已售
   */
  data: {
    listData: [],
    statusArray:[0,'未出售','已出售'],
    buildPrice:0,
    id:undefined,
    buildName:undefined,
    percent:undefined,
    isEdiRole:false,
  },
  goAddData(event){
    let roomid = event.currentTarget.dataset.index;
    let buildingId = event.currentTarget.dataset.buildingId;
    wx.navigateTo({
      url: '../changData/changData?roomid=' + roomid + '&type=1' + '&buildingId=' + buildingId,
    });
  },
  queryBuildRoom(params) {
    let _that = this;
    cloudApi.cloudRequest({
      name: 'operateRoom',
      data: {
        operateType: 'queryAll',
        buildingId: params
      },
      success: res => {
        if (res.result.data) {
          let val = res.result.data
          _that.hasEdiRole();
          val.sort(_that.compare('roomNumber')); //排序
          _that.setData({
            listData: val
          })
          let num = 0, soldMoney = 0;
          for (let key of val) {
            if (key.status > 1) num++
            if (key.soldMoney) soldMoney += parseFloat(key.soldMoney)
          }
          _that.setData({
            percent: `（ ${num} / ${val.length} ）`,
            buildPrice: soldMoney || 0
          })
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
  compare(property) {
    return function (a, b) {
      var value1 = Number(a[property]) ? Number(a[property]):0;
      var value2 = Number(b[property]) ? Number(b[property]):0;
      return value1 - value2;
    }
  },
  hasEdiRole() {
    let role = wx.getStorageSync('role');
    if (Number(role) > 1) {  //提交数据
      this.setData({
        isEdiRole: true
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let {id,name} = options;
    console.log(`当前查询楼栋： ${name} : ${id} `);
    this.setData({
      buildName: name
    })
    this.queryBuildRoom(id);
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