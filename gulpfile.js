const gulp = require("gulp");
const gulpIstanbul = require("gulp-istanbul");
const gulpMocha = require("gulp-mocha");

gulp.task("test", cb => {
  gulp
    .src(["lib/**/*.js", "index.js", "bluebird.js"])
    .pipe(gulpIstanbul())
    .pipe(gulpIstanbul.hookRequire())
    .on("finish", () => {
      gulp
        .src(["test/**/*.js"])
        .pipe(gulpMocha())
        .pipe(gulpIstanbul.writeReports())
        .on("end", cb);
    });
});
