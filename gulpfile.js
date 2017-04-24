var gulp = require('gulp');
var less = require('gulp-less');
var clean = require('gulp-clean');
var babel = require('gulp-babel');
var copy = require('gulp-copy');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var util = require('gulp-util');
var minifycss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var koa = require('koa');
var app = koa();
var cfg = require('./devServer/config');
var zip = require('gulp-zip');
var gulpIgnore = require('gulp-ignore');
var fs = require('fs');
var sequence = require('gulp-sequence');

var DevServer = require("./devServer/server");

// var R = require("r-js");

var iswb = cfg.isWorkbench;
if(iswb){
  var serverConfig = cfg.serverConfig4wb;
}else {
  var serverConfig = cfg.serverConfig;
}
var publishConfig = cfg.publishConfig;

function errHandle(err) {
    console.log(err);
    util.log(err.fileName + '文件编译出错，出错行数为' + err.lineNumber + '，具体错误信息为：' + err.message);
    this.end();
};

// 编译 src 下所有的 html,js 文件到 dist 目录
gulp.task('copy:static', function() {
  return gulp.src(['src/**'])
      .pipe(rename(function(path) {
          path.dirname += '';
      }))
      .pipe(gulp.dest("./dist"));
})



// 完整 copy vendor 目录下的资源到 dist
gulp.task('copy:vendor', function() {

});



// 匹配所有 less文件进行 less 编译
gulp.task('less', function() {
    return gulp.src('src/**/*.less')
        .pipe(less())
        .pipe(rename(function(path) {
            path.extname = ".css"
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('less:dist', function() {
    gulp.src(['src/**/*.less'])
        .pipe(less())
        .pipe(minifycss())
        .pipe(rename(function(path) {
            path.extname = ".css"
        }))
        .pipe(gulp.dest('dist'));
    return gulp.src(['src/**/*.css', '!src/css/**/*.css'])
        .pipe(minifycss())
        .pipe(gulp.dest('dist'));
});



//
gulp.task('es2015', function() {
    console.log('编译 JS 代码，支持 ES6 语法编译')
    return gulp.src(['src/**/*.es'])
        .pipe(babel({
            presets: ['es2015'],
            plugins: ['transform-es2015-modules-amd']
        }))
        .on('error', errHandle)
        .pipe(rename(function(path) {
            path.extname = ".js"
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('es2015:dist', function() {
    return gulp.src(['src/**/*.es'])
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015'],
            plugins: ['transform-es2015-modules-amd']
        }))
        .pipe(rename(function(path) {
            path.extname = ".js"
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .on('error', errHandle)
        .pipe(gulp.dest('dist'));
});
//压缩js
gulp.task('uglify:config', function(){
    return gulp.src(['src/configs/*.js'])
    .pipe(uglify())
    .pipe(gulp.dest('dist/configs'));
});
gulp.task('uglify:modules', function(){
    return gulp.src(['src/modules/**/*.js'])
    .pipe(uglify())
    .pipe(gulp.dest('dist/modules'));
});
gulp.task("uglify:pages",function(){
	return gulp.src(['src/pages/**/*.js'])
	.pipe(uglify())
	.pipe(gulp.dest('dist/pages'));
});
gulp.task('uglify', sequence('uglify:config', 'uglify:modules','uglify:pages'))

//打包为war
gulp.task("_package", function() {
    var condition = ['index.html', 'index.css', 'main.css', 'bower.json', '/document/', '*.es', '*.less', './**/*.map'];//打包忽略文件列表
    return gulp.src(['dist/**']).pipe(gulpIgnore.exclude(condition)).pipe(zip('dist.war')).pipe(gulp.dest('./'));
});

gulp.task('package', sequence('copy:vendor', 'copy:static', 'es2015:dist', 'less:dist', 'uglify', '_package'));

//安装到maven中
gulp.task("install", function() {

        if (!publishConfig) {
            console.console.error("can't find publishConfig in config.js");
        }
        var targetPath = fs.realpathSync('.');
        var installCommandStr = publishConfig.command + " install:install-file -Dfile=" + targetPath + "/dist.war   -DgroupId=" + publishConfig.groupId + " -DartifactId=" + publishConfig.artifactId + "  -Dversion=" + publishConfig.version + " -Dpackaging=war";
        var process = require('child_process');
        var installWarProcess = process.exec(installCommandStr, function(err, stdout, stderr) {
            if (err) {
                console.log('install war error:' + stderr);
            }
        });
        installWarProcess.stdout.on('data', function(data) {
            console.info(data);
        });
        installWarProcess.on('exit', function(data) {
            console.info('install war success');
        })

    })
    //发布到maven仓库中
gulp.task("_deploy", function() {
    if (!publishConfig) {
        console.console.error("can't find publishConfig in config.js");
    }
    var process = require('child_process');
    var targetPath = fs.realpathSync('.');
    var publishCommandStr = publishConfig.command + " deploy:deploy-file  -Dfile=" + targetPath + "/dist.war   -DgroupId=" + publishConfig.groupId + " -DartifactId=" + publishConfig.artifactId + "  -Dversion=" + publishConfig.version + " -Dpackaging=war  -DrepositoryId=" + publishConfig.repositoryId + " -Durl=" + publishConfig.repositoryURL;
    console.info(publishCommandStr);
    var publishWarProcess = process.exec(publishCommandStr, {
        encoding: 'utf8',
        timeout: 0,
        maxBuffer: Infinity, // 默认 200 * 1024
        killSignal: 'SIGTERM'
    }, function(err, stdout, stderr) {
        if (err) {
            console.log('publish war error:' + stderr);
        }
    });

    publishWarProcess.stdout.on('data', function(data) {
        console.info(data);
    });
    publishWarProcess.on('exit', function(data) {
        console.info('publish  war success');
    });
});

//监听文件改动，执行相应任务
gulp.task('watch', function() {
    console.log('监听文件改动，执行相应任务')
    gulp.watch('src/**/*.less', ['less']);
    gulp.watch('src/**/*.es', ['es2015']);
    // gulp.watch(['src/**/*.html', 'src/**/*.js', 'src/**/*.css'], ['copy:static']);
});

//清空 dist 目录下的资源
gulp.task('clean', function() {
    console.log('清空 dist 目录下的资源')
    return gulp.src(['dist.war', './dist'], {
            read: false
        })
        .pipe(clean({
            force: true
        }));
});

//
gulp.task('dev-server', function() {
    serverConfig.app = app;
    var mockServer = new DevServer(serverConfig);
    mockServer.start(serverConfig);
});

gulp.task('deploy', sequence('clean', 'package', '_deploy'));
gulp.task('copy', ['copy:vendor']);
gulp.task('before', ['copy','less', 'es2015']);
gulp.task('default', [
  // 'copy:static',//作为代理服务器时不移动文件
  'dev-server', 'watch']);
