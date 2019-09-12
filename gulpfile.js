const gulp = require("gulp");
const run = require("gulp-run-command").default;

/*
    -- TOP LEVEL FUNCTIONS --
    gulp.task - Define tasks
    gulp.src - Point to files to use
    gulp.dest - Ponts to folder to output
    gulp.watch - Watc files in folders to change

*/

// Logs message

gulp.task("gen_parser", run("nearleyc ./src/grammar.ne -o grammar.js"));

gulp.task("watch", () => gulp.watch("./src/*.ne", gulp.series("gen_parser")));
