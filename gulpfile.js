const gulp = require("gulp");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const exec = require("child_process").exec;
const browserSync = require("browser-sync").create();

const mainJs = "./main.js";
const destination = "./dist/";
const to_copy = ["./style.css", "./index.html", "./main.js"]
/*
    -- TOP LEVEL FUNCTIONS --
    gulp.task - Define tasks
    gulp.src - Point to files to use
    gulp.dest - Ponts to folder to output
    gulp.watch - Watc files in folders to change

*/

function gen_parser(callback) {
  exec(("npx nearleyc grammar.ne -o " + destination + "grammar.js"), function(
    err,
    stdout,
    stderr
  ) {
    console.log(stdout);
    console.log(stderr);
    callback(err);
  });
}

function copy(file) {
  return gulp.src(file).pipe(gulp.dest(destination));
}

function my_browserify() {
  return browserify(mainJs, {basedir: "./dist"})
    .bundle()
    .pipe(source("./dist/bundle.js"))
    .pipe(gulp.dest(destination));
}


async function copy_all() {
  to_copy.forEach(file => {
    copy(file)
  });
  await Promise.resolve(("ignore"))
}


function watch() {
  gulp.watch("./*.ne", gulp.series(genParser, copy(), my_browserify))
  // gulp.watch("./*.js", gulp.series(myBrowserify));
  // gulp.watch("./*.css", gulp.series(copy_to_destination("./style.css")))
}


exports.copy_all = copy_all
exports.my_browserify = my_browserify;
exports.copy = copy;
exports.gen_parser = gen_parser;
exports.watch = watch;
