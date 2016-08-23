## Angular Activity Monitor
This is a simple service that will emit a couple of events based on the users' DOM activity. It also allows you to "keep items alive" in the background so long as the user is considered "active".

#### Installation:
```bash
$ [npm|bower] install --save angular-activity-monitor
```

#### Usage:
```js
// with bower (or without packaging)
angular.module('myModule', ['ActivityMonitor']);

// with npm (via webpack or Browserify)
angular.module('myModule', [require('angular-activity-monitor')]);

MyController.$inject = ['ActivityMonitor'];
function MyController(ActivityMonitor) {
  ActivityMonitor.on('inactive', function() {
    alert("y0, you're inactive!");
  });
}
```

##### `ActivityMonitor.options` (configuration):
 * `enabled`: whether to regularly check for inactivity (default: `false`) [bool]
 * `keepAlive`: background execution frequency (default: `800`) [seconds]
 * `inactive`: how long until user is considered inactive (default: `900`) [seconds]
 * `warning`: when user is nearing inactive state (deducted from inactive) (default: `60`) [seconds]
 * `disableOnInactive`: Once user is inactive, all event listeners are detached and activity monitoring is discontinued (default: `true`) [bool]
 * `DOMevents`: array of events on the DOM that count as user activity (default: `['mousemove', 'mousedown', 'mouseup', 'keypress', 'wheel', 'touchstart', 'scroll']`)

##### `ActivityMonitor.user` (information about the user):
 * `action`: timestamp of the users' last action (default: `Date.now()`) [milliseconds]
 * `active`: is the user considered active? (default: `true`) [bool]
 * `warning`: is the user nearing inactivity? (default: `false`) [bool]

##### `ActivityMonitor` Methods:
 * `on(event, callback)` (alias `bind`): subsribe to a particular event
 * `off(event[, callback])` (alias `unbind`): unsubscribe to a particular event. If no `callback` or `namespace` provided, all subscribers for the given `event` will be cleared.
 * `activity()`: manually invoke user activity (this updates the `User` object above)

##### `ActivityMonitor` Events:
 * `keepAlive`: anything to execute (at the `Options.keepAlive` interval) so long as the user is active.
 * `warning`: when user is approaching inactive state
 * `inactive`: when user is officially considered inactive
 
#### How long until user is inactive?
This can be configured by setting the `ActivityMonitor.options.inactive` property to the desired timeout (in seconds).

#### When is the user considered active?
Everytime one of the follow DOM events occur, the `action` and `active` properties on the `User` object is updated accordingly.
```js
var DOMevents = ['mousemove', 'mousedown', 'keypress', 'wheel', 'touchstart', 'scroll'];
```

#### (Un)subscribing and Event namespacing
If you've ever used [`jQuery.unbind()`](http://api.jquery.com/unbind/), you're in luck. This subscription model works _almost_ exactly like that. Subscribing is pretty straight forward using `.on()` or `.bind()` as described above but, unsubscribing gets a little weird. You essentially have two options:
 - Pass the same callback argument to `.unbind()` or `.off()`
 - Subscribe and unsubscribe using event namespacing.

_same callback example_
```js
var foo = function() {
  alert("y0, you're inactive!");
};
ActivityMonitor.on('inactive', foo); /* subscribe */
ActivityMonitor.off('inactive', foo); /* unsubscribe */
```

_event namespace example_

Instead of maintaining references to callbacks in order to unbind them, we can namespace the events and use this capability to easily unbind our actions. Namespaces are defined by using a period (`.`) character when binding to an event:
```js
ActivityMonitor.on('inactive.myEvent', function foo() {
  alert("y0, you're inactive!");
});
ActivityMonitor.off('inactive.myEvent');
```

If there's something missing or some quirk you've found. _FIX OR UPDATE ME!!!_
