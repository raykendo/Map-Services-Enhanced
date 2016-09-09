module.exports = function (grunt) {
    grunt.initConfig({
        eslint: {
            options: {
                configFile: 'conf/eslint.json'
            },
            target: ['src/**/*.js']
        },
        sync: {
            main: {
                files: [
                    {
                        src: ['**', '!package.json', '!Gruntfile.js', '!conf/**', '!node_modules/**'],
                        dest: 'C://Temp//Map_Services_Enhanced'
                    }
                ],
                //verbose: true,
                //pretend: true,
                failOnError: true,
                updateAndDelete: true
            }
        },
        compress: {
            main: {
               options: {
                   archive: 'C:/Temp/MSE.zip'
               },
               files: [
                   {
                       expand: true,
                       cwd: 'C:/Temp/Map_Services_Enhanced/',
                       src: ['**']
                   }
               ] 
            }
        },
        uglify: {
            dist: {
                expand: true,
                cwd: 'src/',
                src: '**/*.js',
                dest: 'C:/Temp/Map_Services_Enhanced/src/',
                ext: '.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-sync');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('default', ["eslint", "sync", 'uglify', "compress"]);
    grunt.registerTask('forTesting', ['eslint', 'sync']);
};