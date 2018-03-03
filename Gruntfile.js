module.exports = function (grunt) {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: ".eslintrc.json"
      },
      target: ["src/**/*.js"]
    },
    sync: {
      main: {
        files: [
          {
            src: [
              "**", 
              "!dist/**", 
              "!build/**", 
              "!package.json", 
              "!Gruntfile.js", 
              "!.eslintrc.json", 
              "!.gitignore",
              "!node_modules/**"],
            dest: "dist/"
          }
        ],
        failOnError: true,
        updateAndDelete: true
      }
    },
    compress: {
      main: {
        options: {
          archive: "build/Release/MSE.zip"
        },
        files: [
          {
            expand: true,
            cwd: "dist/",
            src: ["**"]
          }
        ] 
      }
    },
    uglify: {
      dist: {
        expand: true,
        cwd: "src/",
        src: "**/*.js",
        dest: "dist/src/",
        ext: ".js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-sync");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-compress");

  grunt.registerTask("default", ["eslint", "sync", "uglify", "compress"]);
  grunt.registerTask("forTesting", ["eslint", "sync"]);
  grunt.registerTask("inspect", ["eslint"]);
};