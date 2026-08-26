import ExpoModulesCore
import WidgetKit

public class WidgetSyncModule: Module {
    // App Group identifier - must match iOS entitlements
    private let appGroup = "group.org.example.loopdemo.shared"

    public func definition() -> ModuleDefinition {
        Name("WidgetSync")

        // Set a single JSON value for a key in App Groups UserDefaults
        AsyncFunction("setItem") { (key: String, value: String) -> Bool in
            guard let sharedDefaults = UserDefaults(suiteName: self.appGroup) else {
                throw NSError(domain: "WidgetSync", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to access App Groups UserDefaults"])
            }

            // Store as Data for JSON compatibility
            if let data = value.data(using: .utf8) {
                sharedDefaults.set(data, forKey: key)
                sharedDefaults.synchronize()
                return true
            }
            return false
        }

        // Get a JSON value from App Groups UserDefaults
        AsyncFunction("getItem") { (key: String) -> String? in
            guard let sharedDefaults = UserDefaults(suiteName: self.appGroup) else {
                return nil
            }

            if let data = sharedDefaults.data(forKey: key),
               let value = String(data: data, encoding: .utf8) {
                return value
            }
            return nil
        }

        // Remove a key from App Groups UserDefaults
        AsyncFunction("removeItem") { (key: String) -> Bool in
            guard let sharedDefaults = UserDefaults(suiteName: self.appGroup) else {
                return false
            }

            sharedDefaults.removeObject(forKey: key)
            sharedDefaults.synchronize()
            return true
        }

        // Get all keys matching a prefix (for listing friend data files)
        AsyncFunction("getKeysWithPrefix") { (prefix: String) -> [String] in
            guard let sharedDefaults = UserDefaults(suiteName: self.appGroup) else {
                return []
            }

            return sharedDefaults.dictionaryRepresentation().keys.filter { $0.hasPrefix(prefix) }
        }

        // Reload all widget timelines
        AsyncFunction("reloadAllTimelines") { () -> Void in
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }

        // Reload specific widget kind
        AsyncFunction("reloadTimelines") { (kind: String) -> Void in
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadTimelines(ofKind: kind)
            }
        }

        // Get current widget configurations (for debugging)
        AsyncFunction("getCurrentConfigurations") { () -> [[String: Any]] in
            if #available(iOS 14.0, *) {
                var configs: [[String: Any]] = []

                WidgetCenter.shared.getCurrentConfigurations { result in
                    switch result {
                    case .success(let infos):
                        configs = infos.map { info in
                            [
                                "kind": info.kind,
                                "family": String(describing: info.family)
                            ]
                        }
                    case .failure:
                        break
                    }
                }

                // Note: This is async but we return immediately
                // In practice, use the callback version for accurate results
                return configs
            }
            return []
        }
    }
}
