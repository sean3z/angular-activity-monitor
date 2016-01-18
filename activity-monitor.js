/*jshint -W116, -W030, latedef: false */
'use strict';

(function() {
    angular
        .module('ActivityMonitor', [])
        .service('ActivityMonitor', ActivityMonitor);

    var MILLISECOND = 1000;
    var EVENT_KEEPALIVE = 'keepAlive';
    var EVENT_INACTIVE = 'inactive';
    var EVENT_WARNING = 'warning';

    /* @ngInject */
    function ActivityMonitor($document) {
        var service = this;

        /* configuration */
        service.options = {
            enabled: false, /* is the ActivityMonitor enabled? */
            keepAlive: 800, /* keepAlive ping invterval (seconds) */
            inactive: 900,  /* how long until user is considered inactive? (seconds) */
            warning: 60,    /* when to warn user when nearing inactive state (deducted from inactive in seconds) */
            monitor: 3      /* how frequently to check if the user is inactive (seconds) */
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

        var timer = {
            inactivity: null,   /* setInterval handle to determine whether the user is inactive */
            keepAlive: null     /* setInterval handle for ping handler (options.frequency) */
        };

        /* list of DOM events to determine user's activity */
        var DOMevents = ['mousemove', 'mousedown', 'keypress', 'wheel', 'touchstart', 'scroll'].join(' ');

        return service;

        ///////////////

        function disable() {
            service.options.enabled = false;

            clearInterval(timer.inactivity);
            clearInterval(timer.keepAlive);

            $document.off(DOMevents, activity);
        }

        function enable() {
            $document.on(DOMevents, activity);
            service.options.enabled = true;
            service.user.warning = false;

            timer.keepAlive = setInterval(function() {
                publish(EVENT_KEEPALIVE);
            }, service.options.keepAlive * MILLISECOND);

            timer.inactivity = setInterval(function() {
                var now = Date.now();
                var warning = now - ((service.options.inactive - service.options.warning) * MILLISECOND);
                var inactive = now - (service.options.inactive * MILLISECOND);

                /* should we display warning */
                if (!service.user.warning && service.user.action <= warning) {
                    service.user.warning = true;
                    publish(EVENT_WARNING);
                }

                /* should user be considered inactive? */
                if (service.user.active && service.user.action <= inactive) {
                    service.user.active = false;
                    publish(EVENT_INACTIVE);
                    disable();
                }
            }, service.options.monitor * MILLISECOND);
        }

        /* invoked on every user action */
        function activity() {
            service.user.active = true;
            service.user.action = Date.now();

            if (service.user.warning) {
                service.user.warning = false;
                publish(EVENT_KEEPALIVE);
            }
        }

        function publish(event) {
            if (!service.options.enabled) return;
            var spaces = Object.keys(events[event]);
            if (!event || !spaces.length) return;
            spaces.forEach(function(space) {
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
})();
