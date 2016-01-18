module.exports = function (grunt) {
    require('jit-grunt')(grunt);

    grunt.initConfig({

    });

    grunt.registerTask('test', ['mocha_istanbul:server'])
};
