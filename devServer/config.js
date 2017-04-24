var mockConfigs = require('../mock.config');
module.exports = {
    publishConfig: {
        command: "mvn",
        repositoryId: "ecmp-Snapshots",
        repositoryURL: "http://maven.yonyou.com/nexus/content/repositories/ecmp-Snapshots/",
        artifactId: "ecmp-portal-static",
        groupId: "com.yonyou.ec",
        version: "0.0.1-SNAPSHOT"
    },
    serverConfig: {
        serverport: 8088,
        context: '/', //当前应用对应的上下文
        isProxyFirst: true, // isProxyFirst : 是否后端代理优先     //true -> 优先使用代理服务器数据，false -> 使用本地模拟数据
        staticFilePath:['../ecp/ecppub/hotwebs','../ecwebpub/ecwebpub/hotwebs'],
        proxyList: [
        {
            host: 'http://10.10.3.157:80',
            context: '/ecp'
        },
        {
            host: 'http://10.10.3.157:80',
            context: '/web'
        }
        ], //代理服务器列表
        proxyIgnore: [
        ], //代理忽略的URL列表
        mockList:mockConfigs, //模拟请求列表
    }
}
