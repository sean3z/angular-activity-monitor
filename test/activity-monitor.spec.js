/* jshint -W117, -W030 */
'use strict';

describe('Angular Activity Monitor', function() {

  beforeEach(module('ActivityMonitor'));

    var ActivityMonitor;
    var noop = function() {};
    var options;

    beforeEach(inject(function(_ActivityMonitor_) {
        ActivityMonitor = _ActivityMonitor_;

        ActivityMonitor.options.keepAlive = 0.3; /* ping invterval (seconds) */
        ActivityMonitor.options.inactive = 0.4;  /* user is considered inactive (seconds) */
        ActivityMonitor.options.warning = 0.1;   /* warn user about inactivity (deducted from inactive in seconds) */
        ActivityMonitor.options.monitor = 0.2;   /* how frequently to check if the user is inactive (seconds) */

        options = ActivityMonitor.options;
    }));

    describe('when invoked', function() {
        it('should have predefined options', function() {
            expect(options).to.be.an.object;
        });

        it('should be disabled', function() {
            expect(options.enabled).to.equal(false);
        });

        it('should allow users to override options', function() {
            expect(options.keepAlive).to.not.equal(800);
        });

        it('should contain an object about the users\' activity', function() {
            expect(ActivityMonitor.user).to.be.an.object;
        });

        it('should consider the user active by default', function() {
            expect(ActivityMonitor.user.active).to.equal(true);
        });

        it('should allow consumer to subsribe to events', function() {
            expect(ActivityMonitor.on).to.be.a.function;
            expect(ActivityMonitor.bind).to.be.a.function;
            ActivityMonitor.on('keepAlive', noop);
            ActivityMonitor.on(); /* no error when missing event or callback  */
        });

        it('should allow consumer to unsubsribe to events', function() {
            expect(ActivityMonitor.off).to.be.a.function;
            expect(ActivityMonitor.unbind).to.be.a.function;
            ActivityMonitor.off('keepAlive', noop);
            ActivityMonitor.off('keepAlive'); /* clears entire namespace */
        });

        it('should allow consumers to invoke activity', function(done) {
            expect(ActivityMonitor.activity).to.be.a.function;

            setTimeout(function() {
                ActivityMonitor.activity();
                expect(ActivityMonitor.user.action).to.equal(Date.now());
                done();
            }, 2);
        });
    });

    describe('when subscribing to any event', function() {
        it('should enable the service', function() {
            expect(options.enabled).to.equal(false);
            ActivityMonitor.on('keepAlive', noop);
            expect(options.enabled).to.equal(true);
        });

        it('should broadcast events', function(done) {
            var now = Date.now();
            var threshold = options.keepAlive * 1000;

            ActivityMonitor.on('keepAlive', function() {
                expect(Date.now() - now).to.be.at.least(threshold);
                done();
            });
        });
    });

    describe('when broadcasting warning events', function() {
        it('should note that the user is inactive', function(done) {
            var now = Date.now();
            var threshold = (options.inactive - options.warning) * 1000;

            ActivityMonitor.on('warning', function() {
                expect(Date.now() - now).to.be.at.least(threshold);
                expect(ActivityMonitor.user.warning).to.equal(true);

                setTimeout(function() {
                    ActivityMonitor.activity();
                    expect(ActivityMonitor.user.warning).to.equal(false);
                    done();
                }, 1);
            });
        });
    });

    describe('when broadcasting inactive events', function() {
        it('should note that the user is inactive', function(done) {
            var now = Date.now();
            var threshold = options.inactive * 1000;

            ActivityMonitor.on('inactive', function() {
                expect(Date.now() - now).to.be.at.least(threshold);
                expect(ActivityMonitor.user.active).to.equal(false);
                done();
            });
        });

        it('should not broadcast inactive events during activity', function(done) {
            var now = Date.now();
            var threshold = (options.inactive * 1000) * 2;

            setTimeout(function() {
                ActivityMonitor.activity();
            }, (options.inactive - 0.1) * 1000);

            ActivityMonitor.on('inactive', function() {
                expect(Date.now() - now).to.be.at.least(threshold);
                done();
            });
        });
    });

    describe('when not disableOnInactive', function() {
        beforeEach(function(){
            ActivityMonitor.options.disableOnInactive = false
        })

        it('should be enabled',function(done){
            ActivityMonitor.on('keepAlive', noop);
            expect(options.enabled).to.equal(true);

            setTimeout(function() {
                expect(options.enabled).to.equal(true);
                done();
            }, 410);
        })

        it('should reactivate',function(done){
            ActivityMonitor.on('keepAlive', noop);
            expect(options.enabled).to.equal(true);

            setTimeout(function() {
                expect(options.enabled).to.equal(true);

                expect(typeof ActivityMonitor.enable.timer.inactivity).to.equal('undefined');
                expect(typeof ActivityMonitor.enable.timer.keepAlive).to.equal('undefined');

                ActivityMonitor.activity();

                expect(typeof ActivityMonitor.enable.timer.inactivity).to.equal('number');
                expect(typeof ActivityMonitor.enable.timer.keepAlive).to.equal('number');

                done();
            }, 410);
        })
    });

});
