// pages/myCode/changData/changData.js

import WxValidate from '../../../utils/wxValidate.js'
const cloudApi = require('../../../utils/cloudApi.js');

let isTabNow = false;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    formType:'新增来访信息',
    indexTab:0,
    isDisabled:false,
    typeArray: ['接待', '认筹', '认购', '签约'],
    bulidArray: [],
    roomArray:['101','102','103'],
    isContract:false,
    visitTime: undefined,
    visitType: undefined,
    name: undefined,
    dname: undefined,
    phone:undefined,
    buildingNum:undefined,
    roomNum:undefined,
    ediSignMoney:undefined,
    statusArray:['','未签约','已签约'],
    statusNumber:undefined,
    roomDatas:{},
    hasSubmit:true,
  },

  changeTabbar(event){
    // if (isTabNow) return;
    // let id = event.currentTarget.dataset.id;
    // this.setData({
    //   'indexTab': id
    // });
  },

  bindDateChange(e) {
    this.setData({
      hasSubmit: true,
      visitTime: e.detail.value
    })
  },
  
  bindPickerChange: function (e) {
    let that = this;
    console.log(this.isContract)
    console.log('picker发送选择改变，携带值为', e.detail.value, )
    if (e.detail.value ==3){ //签约
      that.setData({
        isContract: true
      })
    }else{
      that.setData({
        isContract: false
      })
    }
    that.setData({
      hasSubmit: true,
      visitType: e.detail.value
    })
  },

  buildPickerChanges(e){
    // console.log('楼栋选择改变，携带值为', e.detail.value)
    let now_picker_build_id = this.data.bulidArray[e.detail.value]._id;
    this.setData({
      hasSubmit:true,
      buildingNum: e.detail.value
    })
    this.queryBuildRoom(now_picker_build_id);
  },
  roomPickerChanges(e) {
    // console.log('房号选择改变，携带值为', e.detail.value)
    this.setData({
      hasSubmit: true,
      roomNum: e.detail.value
    })
    console.log(this.data.roomArray[e.detail.value])
  },
  statusPickerChanges(e){
    // console.log('出售状态选择改变，携带值为', e.detail.value)
    this.setData({
      hasSubmit: true,
      'roomDatas.status': e.detail.value
    })
  },

  //验证函数
  initValidate() {
    const rules = {
      visitTime: {
        required: true,
      },
      visitType: {
        required: true,
      },
      buildingId: {
        required: true,
      },
      roomId: {
        required: true,
      },
      adviser: {
        required: true,
        minlength: 2
      },
      tel: {
        required: true,
        tel: true
      },
      visitPersonName: {
        required: true,
        minlength: 2
      }
    }
    const messages = {
      visitTime: {
        required: '请选择日期',
      },
      visitType: {
        required: '请选择类型',
      },
      buildingId: {
        required: '请选择楼栋',
      },
      roomId: {
        required: '请选择房号',
      },
      visitPersonName: {
        required: '请填写顾问姓名',
        minlength: '姓名至少两个字'
      },
      adviser: {
        required: '请填写客户姓名',
        minlength: '姓名至少两个字'
      },
      tel: {
        required: '请填写手机号',
        tel: '请填写正确的手机号码'
      }
    }
    this.WxValidate = new WxValidate(rules, messages)
  },

//表单提交
  formSubmit: function (e) {
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    const params = e.detail.value;
    //校验表单
    if (!this.WxValidate.checkForm(params)) {
      const error = this.WxValidate.errorList[0]
      this.showModal(error)
      return false
    }
    params.visitTime = params.visitTime.replace(/-/g, '/');
    //调用云函数
    this.addData(params);
  },
  //修改验证函数
  ediWxValidate() {
    const rules2 = {
      status: {
        required: true,
      },

    }
    const messages2 = {
      status: {
        required: '请选择出售状态',
      },
    
    }
    this.ediWxValidate = new WxValidate(rules2, messages2)
  },
  //修改提交
  ediFormSubmit(e){
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    const params = e.detail.value;
    if (!this.ediWxValidate.checkForm(params)) {
      const error = this.ediWxValidate.errorList[0]
      this.showModal(error)
      return false
    }
    //调用云函数
    this.adiRoomData(params);
  },
  showModal(error) {
    wx.showModal({
      content: error.msg,
      showCancel: false,
    })
  },

// wx.cloud.callFunction({
//     name: 'operateVisitRecord',
//     data: {
//         operateType: 'create',
//         tel: '133xxxxxxxx',
//         visitPersonName: '张先生',
//         visitTime: '2019/02/02',
//         visitType: 1, //  0 接待，1认筹，2认购，3签约
//         adviser: '张三', // 可选
//         signMoney: '40万', // 签约状态必须填写，其他状态可选
//         visitRooms: [
//             {
//                 buildingId: 'xxxxxxxx',
//                 roomId: 'xxxxxxxxx',
//             }
//         ]
//     }
// })
//增加到访记录
  addData(params){
    let that = this;
    // console.log(params)
    let datas = params;
    if (datas.visitType && Number(datas.visitType) !== 3) {
      datas.signMoney = 0;
    }
    datas.visitType = Number(datas.visitType);
    datas.operateType = 'create';
    datas.visitRooms = [{ buildingId: params.buildingId, roomId: params.roomId }];  //预留多选 房号
    console.log(datas)
    cloudApi.cloudRequest({
      name: 'operateVisitRecord',
      data: datas,
      success: res => {
        that.setData({
          hasSubmit: false
        })
        wx.showToast({
          icon: 'success',
          title: '提交成功',
        })
      },
    })

  },
  //查询房号信息  （编辑信息-分页）
  queryRoomData(roomId){
    let _that = this;
    let datas = {};
    datas.operateType = 'query';
    datas.roomId = roomId ? roomId:'';

    cloudApi.cloudRequest({
      name: 'operateRoom',
      data: datas,
      success: res => {
        _that.setData({
          roomDatas: res.result.data[0]
        })
      },
    })
  },
//     data: {
//         operateType: 'update',
//         buildingId: 'xxxxxxxxxxx',
//         roomId: 'xxxxxxxxxxx',
//         roomNumber: '101',
//         soldMoney: '', // 可选
//         status: 1
//     }
//修改提交房号信息  （编辑信息-分页）
  adiRoomData(params) {
    let _that = this;
    let datas = {};
    datas.operateType = 'update';
    datas.soldMoney = params.soldMoney;
    datas.status = params.status;
    datas.buildingId = this.data.roomDatas.buildingId;
    datas.roomId = this.data.roomDatas._id;

    cloudApi.cloudRequest({
      name: 'operateRoom',
      data: datas,
      success: res => {
        _that.setData({
          'isDisabled': true,
        })
        wx.showToast({
          icon: 'success',
          title: '提交成功',
        })
      },
    })

  },
  //查询楼栋数据
  queryAllBuild() {
    let _that = this;
    cloudApi.cloudRequest({
      name: 'operateBuilding',
      data: {
        operateType: 'queryAll',
      },
      success: res => {
        if (res.result.data) {
          _that.setData({
            'bulidArray': res.result.data
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
  //查询对应楼栋房间号
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
          _that.setData({
            roomArray: val
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    let room_id = options.roomid;
    if(options.type){
      this.setData({
        'indexTab': options.type,
      })
      isTabNow = false;
      this.queryRoomData(room_id); 
    }else{
      //编辑房间分页处理
      this.setData({
        'isDisabled': true,
      })
      isTabNow = true;
    }
    this.initValidate()//验证规则函数
    this.ediWxValidate();//验证规则函数
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