# Change Log
All notable changes to this project will be documented here.

## 1.1.0 - 2016-08-23
### Features
- Added CHANGELOG.md
- Added `disableOnInactive` option (default: `true`). (#10)
  - This allows the service to resume _after_ a user has been considered inactive.
- Exposed `ActivityMonitor.enable()` and `ActivityMonitor.disable()` for manual control of service. (#10)
