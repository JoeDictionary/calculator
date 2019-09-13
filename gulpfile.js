const gulp = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const exec = require("child_process").exec;
const browserSync = require("browser-sync").create();

const destination = "./dist/";
const srcDir = "./src/";

const mainJs = srcDir + "main.js";
const to_copy = ["./src/main.js", "./src/index.html", "./src/style.css"];

function gen_parser(callback) {
  exec(
    "npx nearleyc " + srcDir + "grammar.ne -o " + destination + "grammar.js",
    function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      callback(err);
    }
  );
}

function copy(file) {
  return gulp.src(file).pipe(gulp.dest("./dist"));
}

function my_browserify() {
  return browserify(mainJs, { basedir: destination })
    .bundle()
    .pipe(source("./bundle.js"))
    .pipe(gulp.dest(destination));
}

async function copy_all() {
  to_copy.forEach(file => {
    copy(file);
  });
  await Promise.resolve("ignore");
}

function watch() {
  // gulp.series(copy_all, gen_parser, my_browserify);
  gulp.watch(srcDir + "*.ne", gulp.series(gen_parser, my_browserify));
  gulp.watch(srcDir + "*.js", gulp.series(copy_all, my_browserify));
  gulp.watch(srcDir + "*.html", gulp.series(copy_all));
  gulp.watch(srcDir + "*.css", gulp.series(copy_all));
  // gulp.watch("./*.css", gulp.series(copy_to_destination("./style.css")))
}

exports.copy_all = copy_all;
exports.copy = copy;
exports.my_browserify = my_browserify;
exports.gen_parser = gen_parser;
exports.watch = watch;
