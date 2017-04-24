var mockConfigs = require('../mock.config');
module.exports = {
    publishConfig: {
        command: "",
        repositoryId: "",
        repositoryURL: "",
        artifactId: "",
        groupId: "",
        version: ""
    },
    serverConfig: {
        serverport: 8088,
        context: '/', //当前应用对应的上下文
        isProxyFirst: true, // isProxyFirst : 是否后端代理优先     //true -> 优先使用代理服务器数据，false -> 使用本地模拟数据
        staticFilePath:['../ecp/ecppub/hotwebs','../ecwebpub/ecwebpub/hotwebs'],//监听的静态文件目录,可以是路径字符串,也可以是路径数组
        proxyList: [
        {
            host: 'http://127.0.0.1:80',
            context: '/ecp'
        },
        {
            host: 'http://127.0.0.1:80',
            context: '/web'
        }
        ], //代理服务器列表
        proxyIgnore: [
        ], //代理忽略的URL列表
        mockList:mockConfigs, //模拟请求列表
    }
}
