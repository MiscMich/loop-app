import AppIntents
import WidgetKit

// MARK: - Friend Entity

struct FriendEntity: AppEntity {
    let id: String
    let name: String
    let avatarUrl: String?

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Friend"
    static var defaultQuery = FriendQuery()

    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)")
    }

    init(id: String, name: String, avatarUrl: String? = nil) {
        self.id = id
        self.name = name
        self.avatarUrl = avatarUrl
    }
}

// MARK: - Friend Query

struct FriendQuery: EntityQuery {
    func entities(for identifiers: [FriendEntity.ID]) async throws -> [FriendEntity] {
        let allFriends = loadFriendsFromAppGroup()
        return allFriends.filter { identifiers.contains($0.id) }
    }

    func suggestedEntities() async throws -> [FriendEntity] {
        return loadFriendsFromAppGroup()
    }

    func defaultResult() async -> FriendEntity? {
        return loadFriendsFromAppGroup().first
    }

    // MARK: - App Group Data Loading

    private func loadFriendsFromAppGroup() -> [FriendEntity] {
        guard let sharedDefaults = UserDefaults(suiteName: "group.org.example.loopdemo.shared"),
              let jsonData = sharedDefaults.data(forKey: "widget_friends_list") else {
            return []
        }

        do {
            // The TypeScript writes { friends: [...], lastSyncAt: "..." }
            let friendsListData = try JSONDecoder().decode(FriendsListData.self, from: jsonData)
            return friendsListData.friends.map { FriendEntity(id: $0.id, name: $0.name, avatarUrl: $0.avatar) }
        } catch {
            print("Failed to decode friends list: \(error)")
            return []
        }
    }
}

// MARK: - JSON Models (matching TypeScript FriendsListData)

struct FriendsListData: Codable {
    let friends: [FriendData]
    let lastSyncAt: String
}

struct FriendData: Codable {
    let id: String
    let name: String
    let avatar: String  // matches TypeScript 'avatar' field
}

// MARK: - Select Friend Intent

struct SelectFriendIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Select Friend"
    static var description: IntentDescription = IntentDescription("Choose which friend's updates to display on the widget")

    @Parameter(title: "Friend")
    var friend: FriendEntity?

    init() {}

    init(friend: FriendEntity?) {
        self.friend = friend
    }
}
