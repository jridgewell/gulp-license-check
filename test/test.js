'use strict';
/* global describe, it */

var fs = require('fs'),
	assert = require('assert'),
	es = require('event-stream'),
	should = require('should'),
	File = require('gulp-util').File,
	gutil = require('gulp-util'),
	gulp = require('gulp'),
	license = require('../');

require('mocha');

describe('gulp-license-check', function () {

	describe('in buffer mode', function () {

		it('file should pass through', function (done) {

			var fileCount = 0;
			var stream = license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			});

			stream.on('data', function (file) {
				assert(!file.isStream());
				should.exist(file);
				should.exist(file.contents);
				++fileCount;
			});

			stream.once('end', function () {
				gutil.log('end');
				fileCount.should.equal(1);
				done();
			});

			stream.write(new File({
				path: './test/fixture/ok.js',
				contents: fs.readFileSync('./test/fixture/ok.js')
			}));
			stream.end();
		});
	});

	describe('in streaming mode', function () {

		it('file should pass through', function (done) {

			var fileCount = 0;
			var stream = license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			});

			stream.once('data', function (file) {
				assert(file.isStream());
				should.exist(file);
				should.exist(file.contents);
				++fileCount;
			});

			stream.once('end', function () {
				fileCount.should.equal(1);
				done();
			});

			stream.write(new File({
				path: './test/fixture/ok.js',
				contents: es.merge([
					fs.createReadStream('./test/fixture/ok.js')
				])
			}));
			stream.end();
		});
	});

	describe('setting tests', function () {

		it('if {log: false } should not log in console and event', function (done) {
			var logs = [];
			var stream = gulp.src('./test/fixture/ko.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			}));

			stream.on('log', function (log) {
				logs.push(log);
			});

			stream.on('data', function () {
			});

			stream.on('end', function () {
				logs.length.should.equal(0);
				done();
			});
		});

		it('if {log: true } should log in console and event', function (done) {
			var logs = [];
			var stream = gulp.src('./test/fixture/ko.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: true
			}));

			stream.on('log', function (log) {
				logs.push(log);
			});

			stream.on('data', function () {
			});

			stream.on('end', function () {
				logs.length.should.equal(1);
				done();
			});
		});

		it('if header file do not exist throw an error', function (done) {

			gulp.src('./test/fixture/ok.js').pipe(license({
				path: './test/fixture/header_no_exist.txt',
				blocking: false,
				log: false
			}).on('error', function (error) {
				should.exist(error.message);
				error.message.should.equal('The license header file doesn`t exist ./test/fixture/header_no_exist.txt');
				done();
			}));
		});

		it('if license not present in a file and {blocking: true} should throw an error', function (done) {

			var stream = gulp.src('./test/fixture/ko.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: true,
				log: false
			}));

			stream.once('error', function (error) {
				should.exist(error.message);
				error.message.should.containEql('The following file doesn`t contain the license header');
				done();
			});
		});

		it('if license not present in a file and {blocking: false} should not throw an error', function (done) {

			var files = [];
			var errors = [];

			var stream = gulp.src('./test/fixture/*.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			}));

			stream.on('error', function (error) {
				errors.push(error);
				done();
			});

			stream.on('data', function (file) {
				files.push(file);
			});

			stream.on('end', function () {
				files.length.should.equal(2);
				errors.length.should.equal(0);
				done();
			});
		});
	});

	describe('behaviour tests', function () {

		it('multiple files should pass through', function (done) {

			var files = [];
			var stream = gulp.src('./test/fixture/*.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			}));

			stream.on('error', done);

			stream.on('data', function (file) {
				files.push(file);
			});

			stream.on('end', function () {
				files.length.should.equal(2);
				done();
			});
		});

		it('no files are acceptable', function (done) {

			var files = [];
			var stream = gulp.src('./test/fixture/*.donotexist').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			}));

			stream.on('error', done);

			stream.on('data', function (file) {
				files.push(file);
			});

			stream.on('end', function () {
				files.length.should.equal(0);
				done();
			});

			stream.end();
		});

		it('if license present in a file and {blocking: true} should not throw an error', function (done) {

			var files = [];
			var errors = [];

			var stream = gulp.src('./test/fixture/ok.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: false
			}));

			stream.on('error', function (error) {
				errors.push(error);
				done();
			});

			stream.on('data', function (file) {
				files.push(file);
			});

			stream.on('end', function () {
				files.length.should.equal(1);
				errors.length.should.equal(0);
				done();
			});
		});

		it('if license present in a file should be logged as header present', function (done) {

			var stream = gulp.src('./test/fixture/ok.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: true
			}));

			stream.on('log', function (log) {
				log.msg.should.equal('Header present');
				log.path.should.containEql('/test/fixture/ok.js');
			});

			stream.on('data', function () {
			});

			stream.on('end', function () {
				done();
			});
		});

		it('if license not present in a file should be logged as header not present', function (done) {

			var stream = gulp.src('./test/fixture/ko.js').pipe(license({
				path: './test/fixture/header.txt',
				blocking: false,
				log: true
			}));

			stream.on('log', function (log) {
				log.msg.should.equal('Header not present');
				log.path.should.containEql('/test/fixture/ko.js');
			});

			stream.on('data', function () {
			});

			stream.on('end', function () {
				done();
			});
		});
	});
});
