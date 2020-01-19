// pages/myCode/saleDetail/saleDetail.js
const cloudApi = require('../../../utils/cloudApi.js');
let parmas, pageNums = 1;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    detailData:[
// { adviser: "test",
// buildingId: "0",
// signMoney: 0,
// tel: "18312345678",
// visitPersonName: "asd",
// visitTime: "2020/01/04",
// visitType: "0",
// _id: "6d3904ca5e0fe1f5003831ce23bc455f"},

    ],
    VISIT_TYPE_CODE: ['接待', '认筹', '认购', '签约'],
    nowTitle:undefined,

  },
  getSalesData(params,num) {
    let _that = this;
    // console.log(params)
    cloudApi.cloudRequest({
      name: 'operateVisitRecord',
      data: {
        operateType: 'query',
        queryRange: JSON.parse(params.time),
        visitType: params.type ? Number(params.type)+1 : '',
        pageNum: num,
        pageSize:30
      },
      success: res => {
        let nowData;
        if(num ==1){
          nowData = [];
        }else{
          nowData = _that.data.detailData;
        }
        if (JSON.parse(params.time)[0] == 1) {
          if (res.result.data.today.length) {
            nowData = nowData.concat(res.result.data.today)
          }
          _that.setData({
            detailData: nowData,
            nowTitle: '今日'
          })
        } else if (JSON.parse(params.time)[0] == 2) {
          if (res.result.data.week.length) {
            nowData = nowData.concat(res.result.data.week)
          }
          _that.setData({
            detailData: nowData,
            nowTitle: '本周'
          })
        } else if (JSON.parse(params.time)[0] == 10) {
          if (res.result.data.total.length){
            nowData = nowData.concat(res.result.data.total)
          }
          _that.setData({
            detailData: nowData,
            nowTitle: '总共'
          })
        }
        wx.stopPullDownRefresh() //停止下拉刷新动画
      },
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    parmas = options;
    this.getSalesData(options,1);
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
    pageNums = 1;
    this.getSalesData(parmas, pageNums);//刷新
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    pageNums++;
    this.getSalesData(parmas, pageNums);//刷新
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})