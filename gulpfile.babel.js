'use strict'
const projectName = 'shopia-Semen.loc'
/****************************************************************************************************/
//MODULES REQUIRE
/****************************************************************************************************/
import { src, dest, symlink, lastRun, task, watch, series, parallel } from 'gulp'
import postcss from 'gulp-postcss'
import csso from 'postcss-csso'
import customProperties from 'postcss-custom-properties'
import apply from 'postcss-apply'
import postcssNesting from 'postcss-nesting'
import postcssNested from 'postcss-nested'
import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import mqp from 'css-mqpacker'
import sourcemaps from 'gulp-sourcemaps'
import newer from 'gulp-newer'
import debug from 'gulp-debug'
import gulpIf from 'gulp-if'
import imagemin from 'gulp-imagemin'
import svgmin from 'gulp-svgmin'
import svgSymbols from 'gulp-svg-symbols'
import del from 'del'
import mainNpmFiles from 'npmfiles'
import flatten from 'gulp-flatten'
import remember from 'gulp-remember'
import cached from 'gulp-cached'
import path from 'path'
import webpack from 'webpack'
import gulpwebpack from 'webpack-stream'
import plumber from 'gulp-plumber'
import fileinclude from 'gulp-file-include'
import { create } from 'browser-sync'

const browserSync = create()
/****************************************************************************************************/
//DEV OR PRODUCTION
/****************************************************************************************************/
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
/****************************************************************************************************/
//PATHS AND SETTINGS
/****************************************************************************************************/
const cms = {
  modx: {
    html: 'build/',
    css: 'build/assets/css/',
    js: 'build/assets/js/',
    img: 'build/assets/',
    libs: 'build/assets/libs/',
    fonts: 'build/assets/fonts/'
  },
  docs: {
      html: 'docs/',
      css: 'docs/assets/css/',
      js: 'docs/assets/js/',
      img: 'docs/assets/',
      libs: 'docs/assets/libs/',
      fonts: 'docs/assets/fonts/'
  },  
  wordpress: {
    html: 'build/',
    css: 'build/css/',
    js: 'build/js/',
    img: 'build/',
    libs: 'build/libs/',
    fonts: 'build/fonts/'
  }
}

/****************************************************************************************************/
//HTML task
/****************************************************************************************************/
task('html', () =>
  src('src/*.html', {since: lastRun('html')})
    .pipe(plumber())
    .pipe(fileinclude())
    .pipe(dest(cms.wordpress.html))
    .pipe(browserSync.stream())
)

/****************************************************************************************************/
//HTML templates task
/****************************************************************************************************/
task('html:templates', () =>
  src('src/*.html')
    .pipe(plumber())
    .pipe(fileinclude())
    .pipe(dest(cms.wordpress.html))
    .pipe(browserSync.stream())
)
/****************************************************************************************************/
//CSS task
/****************************************************************************************************/
task('css', (cb) => {
  let processors = [
    postcssImport({path: ['src/css']}),
    customProperties,
    apply,
    postcssNesting,
    postcssNested,
    autoprefixer({cascade: false}),
    mqp({sort: true})
  ]
  src('src/css/style.css')
    .pipe(plumber())
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(postcss(processors))
    .pipe(gulpIf(!isDevelopment, postcss([csso({restructure: false, debug: true})])))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(dest(cms.wordpress.css))
    .pipe(browserSync.stream())
  cb()
})
/****************************************************************************************************/
//JS task
/****************************************************************************************************/
task('js', () =>
  src('src/js/main.js')
    .pipe(plumber())
    .pipe(gulpwebpack(require('./webpack.config.js'), webpack))
    .pipe(dest(cms.wordpress.js))
    .pipe(browserSync.stream())
)
/****************************************************************************************************/
//LIBS task
/****************************************************************************************************/
task('libs', () =>
  src(mainNpmFiles(), {base: './node_modules'})
    .pipe(flatten({includeParents: 1}))
    .pipe(newer(cms.wordpress.libs))
    .pipe(dest(cms.wordpress.libs))
)
/****************************************************************************************************/
//MY LIBS task
/****************************************************************************************************/
task('mylibs', () =>
  src('src/libs/**/*.*')
    .pipe(flatten({includeParents: 1}))
    .pipe(dest(cms.wordpress.libs))
)
/****************************************************************************************************/
//FONTS task
/****************************************************************************************************/
task('fonts', () =>
  src('src/fonts/**/*.*')
    .pipe(newer(cms.wordpress.fonts))
    .pipe(gulpIf(isDevelopment, symlink(cms.wordpress.fonts), dest(cms.wordpress.fonts)))
)
/****************************************************************************************************/
//IMG task (jpg,png,gif)
/****************************************************************************************************/
task('img', () =>
  src(['src/img/**/*.{jpg,png,gif}', 'src/images/**/*.{jpg,png,gif}'], {base: 'src'})
    .pipe(newer(cms.wordpress.img))
    .pipe(gulpIf(!isDevelopment, imagemin({progressive: true})))
    .pipe(gulpIf(isDevelopment, symlink(cms.wordpress.img), dest(cms.wordpress.img)))
)
/****************************************************************************************************/
//SVG task
/****************************************************************************************************/
task('svg', () =>
  src('src/img/svg/**/*.svg', {base: 'src'})
    .pipe(newer(cms.wordpress.img))
    .pipe(gulpIf(!isDevelopment, dest(cms.wordpress.img), symlink(cms.wordpress.img)))
)
/****************************************************************************************************/
//SVG sprite icons
/****************************************************************************************************/
task('svg:icons', () =>
  src('src/img/svg/icons/*.svg')
    .pipe(cached('svg:icons'))
    .pipe(svgmin({
      plugins: [
        {removeEditorsNSData: true},
        {removeTitle: true}
      ]
    }))
    .pipe(remember('svg:icons'))
    .pipe(svgSymbols({
      templates: [
        'default-svg'
      ]
    }))
    .pipe(svgmin({
      plugins: [
        {cleanupIDs: false}
      ]
    }))
    .pipe(dest('src/img/svg'))
)
/****************************************************************************************************/
//DEL build directory
/****************************************************************************************************/
task('clean', (cb) => {
  del('build')
  cb()
})

/****************************************************************************************************/
//Copy favicon
/****************************************************************************************************/
task('favicon', () =>
  src('src/favicon.ico')
    .pipe(gulpIf(!isDevelopment, dest(cms.wordpress.html), symlink(cms.wordpress.html)))
)
/****************************************************************************************************/
//WATCHERS
/****************************************************************************************************/
task('watch', (cb) => {
  watch('src/*.html', series('html')).on('unlink', (filepath) => {
    let filePathFromSrc = path.relative(path.resolve('src/'), filepath)
    let destFilePath = path.resolve(cms.wordpress.html, filePathFromSrc)
    del.sync(destFilePath)
  })
  watch('src/templates/*.html', series('html:templates'))
  watch('src/css/**/*.css', series('css'))
  watch(['src/js/*.js', 'src/js/modules/*.js'], series('js'))
  watch('src/**/*.{jpg,png,gif}', series('img')).on('unlink', (filepath) => {
    let filePathFromSrc = path.relative(path.resolve('src/'), filepath)
    let destFilePath = path.resolve(cms.wordpress.img, filePathFromSrc)
    del.sync(destFilePath)
  })
  watch(['src/img/svg/*.svg', 'src/img/svg/icons/*.svg'], series('svg')).on('unlink', (filepath) => {
    let filePathFromSrc = path.relative(path.resolve('src/'), filepath)
    let destFilePath = path.resolve(cms.wordpress.img, filePathFromSrc)
    del.sync(destFilePath)
  })
  watch('src/img/svg/icons/*.svg', series('svg:icons')).on('unlink', (filepath) => {
    remember.forget('svg:icons', path.resolve(filepath))
    delete cached.caches['svg:icons'][path.resolve(filepath)]
  })
  watch('src/fonts/**/*.*', series('fonts')).on('unlink', (filepath) => {
    let filePathFromSrc = path.relative(path.resolve('src/fonts'), filepath)
    let destFilePath = path.resolve(cms.wordpress.fonts, filePathFromSrc)
    del.sync(destFilePath)
  })
  cb()
})
/****************************************************************************************************/
//BROWSER-SYNC task
/****************************************************************************************************/
task('serve', (cb) => {
  browserSync.init({
    proxy: projectName,
    open: false,
    notify: false
  })
  cb()
})
/****************************************************************************************************/
//GLOBAL TASKS
/****************************************************************************************************/
task('build', series(parallel('html', 'css', 'js', 'libs', 'mylibs', 'favicon', 'fonts', 'img', 'svg:icons'), 'svg'))
task('dev', series('build', parallel('watch', 'serve')))
