'use strict';

var serve = require('./staticFileServer');
var proxy = require('./proxyServer');
var router = require('koa-router')();
var fetch = require('node-fetch');
var path = require('path');

module.exports = function(options) {
  var app = options.app;
  var isProxyFirst = options.isProxyFirst;
  var proxyIgnore = options.proxyIgnore || [];
  var host = options.host;
  var username = options.username;
  var password = options.password;
  var context = options.context || '';
  var port = options.serverport || 8000;
  var mockList = options.mockList;
  var proxyList = options.proxyList;
  var staticFilePath = options.staticFilePath || "/dist";
  var proxycontext = "/";
  if(proxyList&&proxyList.length>0){
    proxycontext = proxyList[0].context;
  }

  return {
    start : function(){
      //模拟数据方法
      function mock(){
        mockList.forEach(function( config ){
          var url = proxycontext+config['url'];
          router[ config['type'] ]( url, function *(next) {
            var mockFile = require('../mockData/' + config['json']);
            this.body = JSON.stringify(mockFile);
            console.log('Mock URL: ' ,'\x1b[32m', config['url'] + ' --> ' + config['json'] , '\x1b[0m', ' started.');
          });
        });
      }
      //将静态资源映射为服务器,如果静态文件目录为数组则进行循环映射
      if(typeof staticFilePath == 'string'){
        app.use(serve(path.join(path.join(process.cwd(), staticFilePath)),{context : context}));
      }else{
        console.log("多个静态资源目录:");
        staticFilePath.forEach(function(staticpath){
          console.log(staticpath);
          app.use(serve(path.join(path.join(process.cwd(), staticpath)),{context : context}));
        })
      }
      //判断是否开启代理,未开启则使用模拟数据
      if(!isProxyFirst){
        mock();
      }else if(proxyList) {
        proxyList.forEach(function( config ){
          app.use(proxy({
            host: config.host,
            context: config.context,
            proxyIgnore: proxyIgnore
          }));
          console.log('Proxy :','\x1b[33m', config.context +' -> ' , config.host , '\x1b[0m',' Started.');
        });
      }

      app.use(router.routes()).use(router.allowedMethods());
      console.log('FE test server  ','\x1b[33m','http://localhost:'+  port , '\x1b[0m',' Started.');
      app.listen(port);
    }
  }
};
