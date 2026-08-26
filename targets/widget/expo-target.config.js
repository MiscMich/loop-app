/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'LoopWidget',
  bundleIdentifier: 'org.example.loopdemo.widget',
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': ['group.org.example.loopdemo.shared'],
  },
  frameworks: ['SwiftUI', 'WidgetKit', 'AppIntents'],
};
