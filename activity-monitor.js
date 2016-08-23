/*jshint -W116, -W030, latedef: false */
'use strict';

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // CommonJS
        if (typeof angular === 'undefined') {
            factory(require('angular'));
        } else {
            factory(angular);
        }
        module.exports = 'ActivityMonitor';
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['angular'], factory);
    } else {
        // Global variables
        factory(root.angular);
    }
}(this, function (angular) {
    var m = angular
            .module('ActivityMonitor', [])
            .service('ActivityMonitor', ActivityMonitor);

    var MILLISECOND = 1000;
    var EVENT_KEEPALIVE = 'keepAlive';
    var EVENT_INACTIVE = 'inactive';
    var EVENT_WARNING = 'warning';
    var EVENT_ACTIVITY = 'activity';

    ActivityMonitor.$inject = ['$document'];
    function ActivityMonitor($document) {
        var service = this;

        /* configuration */
        service.options = {
            enabled: false, /* is the ActivityMonitor enabled? */
            keepAlive: 800, /* keepAlive ping invterval (seconds) */
            inactive: 900,  /* how long until user is considered inactive? (seconds) */
            warning: 60,    /* when to warn user when nearing inactive state (deducted from inactive in seconds) */
            monitor: 3,     /* how frequently to check if the user is inactive (seconds) */
            disableOnInactive: true, /* by default, once user becomes inactive, all listeners are detached */
            DOMevents: ['mousemove', 'mousedown', 'mouseup', 'keypress', 'wheel', 'touchstart', 'scroll'] /* list of DOM events to determine user's activity */
        };

        /* user activity */
        service.user = {
            action: Date.now(), /* timestamp of the users' last action */
            active: true,       /* is the user considered active? */
            warning: false      /* is the user in warning state? */
        };

        service.activity = activity;                /* method consumers can use to supply activity */
        service.on = service.bind = subscribe;      /* expose method to subscribe to events */
        service.off = service.unbind = unsubscribe; /* expose method to unsubscribe from events */

        var events = {};
        events[EVENT_KEEPALIVE] = {};  /* functions to invoke along with ping (options.frequency) */
        events[EVENT_INACTIVE] = {};   /* functions to invoke when user goes inactive (options.threshold) */
        events[EVENT_WARNING] = {};    /* functions to invoke when warning user about inactivity (options.warning) */
        events[EVENT_ACTIVITY] = {};   /* functions to invoke any time a user makes a move */

        var timer = {
            inactivity: null,   /* setInterval handle to determine whether the user is inactive */
            keepAlive: null     /* setInterval handle for ping handler (options.frequency) */
        };

        enable.timer = timer;
        service.enable = enable;
        service.disable = disable;

        return service;

        ///////////////

        function disable() {
            service.options.enabled = false;

            disableIntervals()

            $document.off(service.options.DOMevents.join(' '), activity);
        }

        function disableIntervals(){
            clearInterval(timer.inactivity);
            clearInterval(timer.keepAlive);
            delete timer.inactivity;
            delete timer.keepAlive;
        }

        function enable() {
            $document.on(service.options.DOMevents.join(' '), activity);
            service.options.enabled = true;
            service.user.warning = false;

            enableIntervals();
        }

        function enableIntervals(){
            timer.keepAlive = setInterval(function () {
                publish(EVENT_KEEPALIVE);
            }, service.options.keepAlive * MILLISECOND);

            timer.inactivity = setInterval(function () {
                var now = Date.now();
                var warning = now - (service.options.inactive - service.options.warning) * MILLISECOND;
                var inactive = now - service.options.inactive * MILLISECOND;

                /* should we display warning */
                if (!service.user.warning && service.user.action <= warning) {
                    service.user.warning = true;
                    publish(EVENT_WARNING);
                }

                /* should user be considered inactive? */
                if (service.user.active && service.user.action <= inactive) {
                    service.user.active = false;
                    publish(EVENT_INACTIVE);

                    if(service.options.disableOnInactive){
                        disable();
                    }else{
                        disableIntervals();//user inactive is known, lets stop checking, for now
                        dynamicActivity = reactivate;//hot swap method that handles document event watching
                    }
                }
            }, service.options.monitor * MILLISECOND);
        }

        /* function that lives in memory with the intention of being swapped out */
        function dynamicActivity(){
            regularActivityMonitor();
        }

        /* after user inactive, this method is hot swapped as the dynamicActivity method in-which the next user activity reactivates monitors */
        function reactivate() {
            enableIntervals();
            dynamicActivity = regularActivityMonitor;
        }

        /* invoked on every user action */
        function activity(){
            dynamicActivity()
        }

        /* during a users active state the following method is called */
        function regularActivityMonitor() {
            service.user.active = true;
            service.user.action = Date.now();

            publish(EVENT_ACTIVITY);

            if (service.user.warning) {
                service.user.warning = false;
                publish(EVENT_KEEPALIVE);
            }
        }

        function publish(event) {
            if (!service.options.enabled) return;
            var spaces = Object.keys(events[event]);
            if (!event || !spaces.length) return;
            spaces.forEach(function (space) {
                events[event][space] && events[event][space]();
            });
        }

        function subscribe(event, callback) {
            if (!event || typeof callback !== 'function') return;
            event = _namespace(event, callback);
            events[event.name][event.space] = callback;
            !service.options.enabled && enable();
        }

        function unsubscribe(event, callback) {
            event = _namespace(event, callback);

            if (!event.space) {
                events[event.name] = {};
                return;
            }

            events[event.name][event.space] = null;
        }

        /* method to return event namespace */
        function _namespace(event, callback) {
            event = event.split('.');

            if (!event[1] && typeof callback === 'function') {
                /* if no namespace, use callback and strip all linebreaks and spaces */
                event[1] = callback.toString().substr(0, 150).replace(/\r?\n|\r|\s+/gm, '');
            }

            return {
                name: event[0],
                space: event[1]
            };
        }
    }

    return m;
}));