// pages/myCode/index/index.js
import Charts from '../../../utils/wx-charts-min.js';
const cloudApi = require('../../../utils/cloudApi.js');

let buildList = [], soldMoneyList=[];

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isEdiRole:false,
    totalNum: undefined,
    picList: [
      // "../../../images/index_4.png",
      // "../../../images/index_2.png",
    ]
  },
  goDaySale: function() {
    // 防止两次点击操作间隔太快
    var nowTime = new Date();
    if (nowTime - this.data.tapTime < 1000) {
      return;
    }
    this.setData({
      'tapTime': nowTime
    });
    wx.navigateTo({
      url: '../dailySales/dailySales',
    });
  },
  goBuildSale: function() {
    // 防止两次点击操作间隔太快
    var nowTime = new Date();
    if (nowTime - this.data.tapTime < 1000) {
      return;
    }
    this.setData({
      'tapTime': nowTime
    });
    wx.navigateTo({
      url: '../buildSales/buildSales',
    });
  },
  goChangeData: function(e) {
    console.log(e.detail);
    wx.navigateTo({
      url: '../changData/changData',
    });
  },
  //校验登录状态
  doSomeThinkAboutLogin() {
    cloudApi.cloudRequest({
      name: 'userManage',
      data: {
        operateType: 'query',
      },
      success: res => {
        let role = res.result.data[0] ? res.result.data[0].role : 1;
        wx.setStorageSync('role', role);
        this.hasEdiRole(role);
       
      },
    })
  },
  
  initChart(){
    new Charts({
      canvasId: 'canvas3',
      dataPointShape: false,
      type: 'column',
      categories: buildList,
      series: [{
        name: '签约金额统计',
        data: soldMoneyList,
        format: function (val, name) {
          return val.toFixed(2) + '万';
        }
      }],
      yAxis: {
        format: function (val) {
          return val + '万';
        }
      },
      xAxis: {
        disableGrid: true,
      },
      width: 640,
      height: 400,
      dataLabel: true,
      extra: {
        column: {
          width: 15 //柱的宽度
        }
      },
      enableScroll: false,
    });
  },

  hasEdiRole(role){
    let roleNow;
    if (role){
      roleNow = role;
    }else{
      roleNow = wx.getStorageSync('role');
    }
     
    if (Number(roleNow) > 1){  //提交数据
      this.setData({
        isEdiRole:true
      })
    }
  },

  queryAllRoomInfo(){
    cloudApi.cloudRequest({
      name: 'operateRoom',
      data: {
        operateType: 'queryAll',
      },
      success: res => {
        let valBuild = res.result.data,allNum=0;
        buildList = [];
        soldMoneyList = [];
        for (let key in valBuild) {
          let num = 0;
          valBuild[key].map((el,i)=>{
            if (el.status && el.status>1 && el.soldMoney){
              num += Number(el.soldMoney);
            }
          })
          allNum += num;//总金额
          buildList.push(key);//添加楼栋
          soldMoneyList.push(num);//添加对应楼栋金额
        }
        this.setData({
          totalNum: allNum.toFixed(2)
        })
        this.initChart();
      },
    })
  },
  onLoad: function() {
    this.doSomeThinkAboutLogin();

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.queryAllRoomInfo();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})