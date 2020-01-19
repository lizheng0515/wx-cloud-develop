// 添加来访记录

// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()


const db = cloud.database()
const buildingsCollection = db.collection('buildings')
const roomListCollection = db.collection('room-list')
const _ = db.command

const buildData = [
    {
        buildingName: '1号楼'
    },
    {
        buildingName: '3号楼'
    },
    {
        buildingName: '4号楼'
    },
    {
        buildingName: '5号楼'
    },
    {
        buildingName: '6号楼'
    },
    {
        buildingName: '7号楼'
    },
    {
        buildingName: '8号楼'
    },
    {
        buildingName: '9号楼'
    },
    {
        buildingName: '10号楼'
    },
    {
        buildingName: '11号楼'
    },
    {
        buildingName: '12号楼一单元'
    },
    {
        buildingName: '12号楼二单元'
    },
    {
        buildingName: '13号楼一单元'
    },
    {
        buildingName: '13号楼二单元'
    },
    {
        buildingName: '14号楼一单元'
    },
    {
        buildingName: '14号楼二单元'
    },
    {
        buildingName: '15号楼'
    }
]
const roomData = {
    // '1号楼': ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119'],
    '1号楼': ['201','202','203','204'],
    // '3号楼': ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118'],
    '3号楼': ['201','202','203','204'],
    // '4号楼': ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117'],
    '4号楼': ['201','202','203','204'],
    // '5号楼': ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115'],
    '5号楼': ['201','202','203'],
    // '6号楼': ['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119'],
    '6号楼': ['201','202','203','204'],
    // '7号楼': ['101','102','103','104','105'],
    // '8号楼': ['101','102','103','104','105'],
    // '9号楼': ['101','102','103','104','105'],
    // '10号楼': ['101','102','103','104','105'],
    // '11号楼': ['101','102','103','104','105'],
    // '12号楼一单元': [
    //     '101','102','103','201','202','203',
    //     '301','302','303','401','402','403',
    //     '501','502','503','601','602','603',
    //     '701','702','703','801','802','803',
    //     '901','902','903','1001','1002','1003',
    //     '1101','1102','1103','1201','1202','1203',
    //     '1301','1302','1303','1401','1402','1403',
    //     '1501','1502','1503','1601','1602','1603'
    // ],
    // '12号楼二单元': [
    //     '101','102','103','201','202','203',
    //     '301','302','303','401','402','403',
    //     '501','502','503','601','602','603',
    //     '701','702','703','801','802','803',
    //     '901','902','903','1001','1002','1003',
    //     '1101','1102','1103','1201','1202','1203',
    //     '1301','1302','1303','1401','1402','1403',
    //     '1501','1502','1503','1601','1602','1603'
    // ],
    // '13号楼一单元': [
    //     '101','102','103','104','201','202','203','204',
    //     '301','302','303','304','401','402','403','404',
    //     '501','502','503','504','601','602','603','604',
    //     '701','702','703','704','801','802','803','804',
    //     '901','902','903','904','1001','1002','1003','1004',
    //     '1101','1102','1103','1104','1201','1202','1203','1204',
    //     '1301','1302','1303','1304','1401','1402','1403','1404',
    //     '1501','1502','1503','1504','1601','1602','1603','1604'
    // ],
    // '13号楼二单元': [
    //     '101','102','103','104','201','202','203','204',
    //     '301','302','303','304','401','402','403','404',
    //     '501','502','503','504','601','602','603','604',
    //     '701','702','703','704','801','802','803','804',
    //     '901','902','903','904','1001','1002','1003','1004',
    //     '1101','1102','1103','1104','1201','1202','1203','1204',
    //     '1301','1302','1303','1304','1401','1402','1403','1404',
    //     '1501','1502','1503','1504','1601','1602','1603','1604'
    // ],
    // '14号楼一单元': [
    //     '101','102','103','201','202','203',
    //     '301','302','303','401','402','403',
    //     '501','502','503','601','602','603',
    //     '701','702','703','801','802','803',
    //     '901','902','903','1001','1002','1003',
    //     '1101','1102','1103','1201','1202','1203',
    //     '1301','1302','1303','1401','1402','1403',
    //     '1501','1502','1503','1601','1602','1603',
    //     '1701','1702','1703'
    // ],
    // '14号楼二单元': [
    //     '101','102','103','201','202','203',
    //     '301','302','303','401','402','403',
    //     '501','502','503','601','602','603',
    //     '701','702','703','801','802','803',
    //     '901','902','903','1001','1002','1003',
    //     '1101','1102','1103','1201','1202','1203',
    //     '1301','1302','1303','1401','1402','1403',
    //     '1501','1502','1503','1601','1602','1603',
    //     '1701','1702','1703'
    // ],
    // '15号楼': [
    //     '101','102','103','104','105','106',
    //     '201','202','203','204','205','206',
    //     '301','302','303','304','305','306'
    // ],
}

const funMap = {
    // 创建操作
    create: handleCreate,
    // query: handleQuery,
    // queryAll: handleQueryAll,
    // update: handleUpdate,
    // remove: handleRemove
}
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('event:', event)
//   const { operateType } = event

//   const operateMap = ['create', 'remove', 'update', 'query']
//   if (operateMap.indexOf(operateType) === -1) {
//     return {
//       code: 404,
//       data: `没有${operateType}操作类型`
//     }
//   }
  let operateType = 'create'

  try {
    const data = await funMap[operateType](event)

    const wxContext = cloud.getWXContext()

    return {
      code: 0,
      data,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  } catch (e) {
    return {
      code: 404,
      data: e
    }
  }
}


// 创建 builiding 操作
function handleCreate(event) {
  return new Promise(async (resolve, reject) => {

    try {
        // 第一次创建 没有 building
        let allBuildData = []
        // for (const buildItem of buildData) {
        //     let buildData = await cloud.callFunction({
        //         name: 'operateBuilding',
        //         data: {
        //             operateType: 'create',
        //             buildingName: buildItem.buildingName
        //         }
        //     })
        //     console.log('buildData :', buildData)
        //     allBuildData.push({
        //         buildingName: buildItem.buildingName,
        //         id: buildData.result.data.id
        //     })
        // }
        // console.log('allBuildData :', allBuildData)

        // 有building
        let buildData = await cloud.callFunction({
            name: 'operateBuilding',
            data: {
                operateType: 'queryAll',
            }
        })
        console.log('buildData :', buildData);
        buildData.result.data.forEach(item => {
            allBuildData.push({
                buildingName: item.buildingName,
                id: item._id
            })
        })

        for (const buildItem of allBuildData) {
            let curRoomData = roomData[buildItem.buildingName]
            console.log('curRoomData :', curRoomData);
            if (curRoomData) {
                for (const roomNumber of curRoomData) {
                    let roomData = await cloud.callFunction({
                        name: 'operateRoom',
                        data: {
                            operateType: 'create',
                            buildingId: buildItem.id,
                            buildingName: buildItem.buildingName,
                            roomNumber,
                            status: 1 // 转换成整数
                        }
                    })
                    console.log('roomData :', roomData)
                }
            }
        }
        console.log('111 :', 111);
        // allBuildData.forEach(async buildItem => {
        //     let curRoomData = roomData[buildItem.buildingName]
        //     console.log('curRoomData :', curRoomData);
        //     if (curRoomData) {
        //         for (const roomNumber of curRoomData) {
        //             let roomData = await cloud.callFunction({
        //                 name: 'operateRoom',
        //                 data: {
        //                     operateType: 'create',
        //                     buildingId: buildItem.id,
        //                     buildingName: buildItem.buildingName,
        //                     roomNumber,
        //                     status: 1 // 转换成整数
        //                 }
        //             })
        //             console.log('roomData :', roomData)
        //         }
        //     }
        // })
        resolve(allBuildData)
    } catch (e) {
        reject(e)
    }
  })
}