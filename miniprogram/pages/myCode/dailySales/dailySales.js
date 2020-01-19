// pages/myCode/dailySales/dailySales.js

const cloudApi = require('../../../utils/cloudApi.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tapTime:'',
    today:{
      reception: 0, // 接待
      raise: 0,     // 认筹
      subscription: 0, // 认购
      signing: 0,      // 签约
    },
    week: {
      reception: 0, // 接待
      raise: 0,     // 认筹
      subscription: 0, // 认购
      signing: 0,      // 签约
    },
    total: {
      reception: 0, // 接待
      raise: 0,     // 认筹
      subscription: 0, // 认购
      signing: 0,      // 签约
    },
  },
  
  goSaleDetail: function(e) {
    let time = e.currentTarget.dataset['time'];
    let type = e.currentTarget.dataset['type'];
    // 防止两次点击操作间隔太快
    var nowTime = new Date();
    if (nowTime - this.data.tapTime < 1000) {
      return;
    }
    this.setData({
      'tapTime': nowTime
    });
    wx.navigateTo({
      url: '../saleDetail/saleDetail?time='+time+'&type='+type,
    });
  },
  //查询所有接待数据
  getSalesAllData(nowOpenId){
    let that = this;
    cloudApi.cloudRequest({
      name: 'operateVisitRecord',
      data: {
        operateType: 'query',
        queryRange: [1, 2, 10],
      },   // queryRange:数组
      success: res => {
        if (res.result.data) {
          if (res.result.data.today) {
            let today = that.doSomeThingData(res.result.data.today);
            that.setData({
              'today': today
            });
          }
          if (res.result.data.week) {
            let week = that.doSomeThingData(res.result.data.week);
            that.setData({
              'week': week
            });
          }
          if (res.result.data.total) {
            let total = that.doSomeThingData(res.result.data.total);
            that.setData({
              'total': total
            });
          }
          wx.setStorage({
            key: "recordData",
            data: res.result.data
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

  doSomeThingData(val){
    if(!val || !val.length) return; 
    let obj = {
      reception: 0, // 接待
      raise: 0,     // 认筹
      subscription: 0, // 认购
      signing: 0,      // 签约
    }
    val.map(function (el, i) {
      if (el.visitType == 1) {
        obj.raise++
      } else if (el.visitType == 2) {
        obj.subscription++
      } else if (el.visitType == 3) {
        obj.signing++
      } else {
        obj.reception++
      }
    })
    return obj;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getSalesAllData()
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