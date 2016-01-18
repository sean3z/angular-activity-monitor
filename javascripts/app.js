angular
  .module('app', ['ActivityMonitor'])
  .controller('myController', myController);

myController.$inject = ['ActivityMonitor', '$interval'];
function myController(ActivityMonitor, $interval) {
  var vm = this;
  var timeout = 10;
  var interval;

  vm.countdown = timeout;
  vm.startDemo = startDemo;

  /* demo defaults */
  ActivityMonitor.options.inactive = timeout;
  ActivityMonitor.options.monitor = 0.1;
  ActivityMonitor.options.warning = 2;
  
  function startDemo() {
    vm.countdown = timeout;
    ActivityMonitor.off('inactive.demo');
    ActivityMonitor.off('activity.demo');

    interval = $interval(function() {
      vm.countdown--;

      if (!vm.countdown) {
        $interval.cancel(interval);
      }

    }, 1000);

    ActivityMonitor.on('inactive.demo', function() {
      alert('You\'re inactive!');
    });

    ActivityMonitor.on('activity.demo', function() {
      vm.countdown = timeout;
    });
  }
}