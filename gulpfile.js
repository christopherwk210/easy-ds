var gulp = require('gulp'),
    concat = require('gulp-concat'),
    imagemin = require('gulp-imagemin'),
    minifyCSS = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    jshint = require('gulp-jshint'),
    htmlmin = require('gulp-htmlmin'),
    clean = require('gulp-clean'),
    runSequence = require('run-sequence');

gulp.task('build', function(callback) {
  runSequence('clean',
              'html',
              'css',
              'js',
              'images',
              callback);
});

gulp.task('dev', function(callback) {
  runSequence('clean',
              'html',
              'css',
              'js.dev',
              'images.copy',
              callback);
});

gulp.task('clean', function () {
  return gulp.src('dist', {read: false})
    .pipe(clean());
});

gulp.task('html', function() {
  return gulp.src('src/**/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('css', function() {
  return gulp.src('src/assets/css/*.css')
    .pipe(minifyCSS())
    .pipe(autoprefixer())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('dist/assets/css'));
});

gulp.task('js', function() {
  return gulp.src([
      'src/assets/js/*.js'
    ])
    .pipe(jshint())
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(uglify())
    .pipe(concat('scripts.min.js'))
    .pipe(gulp.dest('dist/assets/js'));
});

gulp.task('js.dev', function() {
  return gulp.src([
      'src/assets/js/*.js'
    ])
    .pipe(concat('scripts.min.js'))
    .pipe(gulp.dest('dist/assets/js'));
});

gulp.task('images', function() {
  return gulp.src('src/assets/images/**/*.*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/assets/images'));
});

gulp.task('images.copy', function() {
  return gulp.src('src/assets/images/**/*.*')
    .pipe(gulp.dest('dist/assets/images'));
});

gulp.task('default', [ 'build' ]);
