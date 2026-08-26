import WidgetKit
import SwiftUI
import AppIntents
import UIKit

// MARK: - Data Models

struct LoopContent: Codable, Identifiable {
    let id: String
    let type: String // "doodle", "mood", "photo", "voice", "game"
    let senderName: String
    let senderAvatar: String?
    let emoji: String?
    let note: String?
    let imageUrl: String?
    let createdAt: String
}

struct WidgetData: Codable {
    let latestContent: [LoopContent]
    let currentMood: String?
    let moodNote: String?
    let friendCount: Int
    let unreadCount: Int
    let lastUpdated: String
}

// Friend-specific widget data (for per-friend display)
// Matches TypeScript FriendWidgetData from widgetSync.ts
struct FriendWidgetData: Codable {
    let friendId: String
    let friendName: String
    let friendAvatar: String

    // Latest content from this friend
    let latestContent: FriendLatestContent?

    // Active game with this friend
    let activeGame: FriendActiveGame?

    // Unread count from this friend
    let unreadCount: Int

    // Last sync timestamp
    let lastSyncAt: String
}

struct FriendLatestContent: Codable {
    let id: String
    let type: String // "doodle", "photo", "mood", "voice", "game"
    let thumbnailUrl: String?
    let moodEmoji: String?
    let voiceDuration: Double?
    let timestamp: String
}

struct FriendActiveGame: Codable {
    let id: String
    let board: [String] // 9-cell array ('X', 'O', or '')
    let isYourTurn: Bool
}

// Global widget settings (stored by app)
struct WidgetSettings: Codable {
    let themeId: String
    let styleId: String
    let updatedAt: String
}

// MARK: - Timeline Provider (AppIntent-based)

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> LoopEntry {
        LoopEntry(
            date: Date(),
            content: nil,
            mood: "sparkles",
            moodNote: "Feeling great!",
            friendName: nil,
            friendCount: 5,
            unreadCount: 2,
            themeId: "coral",
            styleId: "standard"
        )
    }

    func snapshot(for configuration: SelectFriendIntent, in context: Context) async -> LoopEntry {
        return loadWidgetData(for: configuration.friend)
    }

    func timeline(for configuration: SelectFriendIntent, in context: Context) async -> Timeline<LoopEntry> {
        let entry = loadWidgetData(for: configuration.friend)

        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }

    private func loadWidgetSettings(from defaults: UserDefaults?) -> WidgetSettings {
        guard let settingsData = defaults?.data(forKey: "widget_settings"),
              let settings = try? JSONDecoder().decode(WidgetSettings.self, from: settingsData) else {
            return WidgetSettings(themeId: "coral", styleId: "standard", updatedAt: "")
        }
        return settings
    }

    private func loadWidgetData(for friend: FriendEntity?) -> LoopEntry {
        let sharedDefaults = UserDefaults(suiteName: "group.org.example.loopdemo.shared")
        let settings = loadWidgetSettings(from: sharedDefaults)

        // If a specific friend is selected, load their data
        if let friend = friend {
            let friendKey = "widget_friend_\(friend.id)"
            if let jsonData = sharedDefaults?.data(forKey: friendKey),
               let friendData = try? JSONDecoder().decode(FriendWidgetData.self, from: jsonData) {

                // Convert FriendLatestContent to LoopContent for display
                let content: LoopContent? = friendData.latestContent.map { latest in
                    LoopContent(
                        id: latest.id,
                        type: latest.type,
                        senderName: friendData.friendName,
                        senderAvatar: friendData.friendAvatar,
                        emoji: latest.moodEmoji,
                        note: nil,
                        imageUrl: latest.thumbnailUrl,
                        createdAt: latest.timestamp
                    )
                }

                // Determine mood emoji from content or default
                let mood = friendData.latestContent?.moodEmoji ?? "sparkles"

                return LoopEntry(
                    date: Date(),
                    content: content,
                    mood: mood,
                    moodNote: friendData.activeGame != nil ? "Game in progress!" : nil,
                    friendName: friendData.friendName,
                    friendCount: 1,
                    unreadCount: friendData.unreadCount,
                    themeId: settings.themeId,
                    styleId: settings.styleId
                )
            }

            // Friend selected but no data yet
            return LoopEntry(
                date: Date(),
                content: nil,
                mood: "sparkles",
                moodNote: "No updates from \(friend.name)",
                friendName: friend.name,
                friendCount: 1,
                unreadCount: 0,
                themeId: settings.themeId,
                styleId: settings.styleId
            )
        }

        // No friend selected - show aggregated data (fallback)
        guard let jsonData = sharedDefaults?.data(forKey: "widgetData"),
              let widgetData = try? JSONDecoder().decode(WidgetData.self, from: jsonData) else {
            return LoopEntry(
                date: Date(),
                content: nil,
                mood: "sparkles",
                moodNote: "Open Loop to get started",
                friendName: nil,
                friendCount: 0,
                unreadCount: 0,
                themeId: settings.themeId,
                styleId: settings.styleId
            )
        }

        return LoopEntry(
            date: Date(),
            content: widgetData.latestContent.first,
            mood: widgetData.currentMood ?? "sparkles",
            moodNote: widgetData.moodNote,
            friendName: nil,
            friendCount: widgetData.friendCount,
            unreadCount: widgetData.unreadCount,
            themeId: settings.themeId,
            styleId: settings.styleId
        )
    }
}

// MARK: - Entry

struct LoopEntry: TimelineEntry {
    let date: Date
    let content: LoopContent?
    let mood: String
    let moodNote: String?
    let friendName: String?  // Selected friend's name (nil = aggregated view)
    let friendCount: Int
    let unreadCount: Int
    let themeId: String
    let styleId: String
}

// MARK: - Widget Theme Helpers

enum WidgetStyle: String {
    case standard
    case compact
    case full

    static func from(_ id: String) -> WidgetStyle {
        return WidgetStyle(rawValue: id) ?? .standard
    }
}

struct WidgetTheme {
    let id: String
    let gradient: [Color]
    let background: Color
    let textPrimary: Color
    let textSecondary: Color
    let badge: Color
    let card: Color

    static func from(_ id: String) -> WidgetTheme {
        switch id {
        case "lavender":
            return WidgetTheme(
                id: id,
                gradient: [Color(hex: "#A1A8EA"), Color(hex: "#C5CAF5")],
                background: Color(hex: "#FFF5EE"),
                textPrimary: .white,
                textSecondary: Color.white.opacity(0.8),
                badge: Color.white.opacity(0.85),
                card: Color.white.opacity(0.9)
            )
        case "lime":
            return WidgetTheme(
                id: id,
                gradient: [Color(hex: "#97DC38"), Color(hex: "#C5F06A")],
                background: Color(hex: "#FFF5EE"),
                textPrimary: .white,
                textSecondary: Color.white.opacity(0.85),
                badge: Color.white.opacity(0.85),
                card: Color.white.opacity(0.9)
            )
        case "gold":
            return WidgetTheme(
                id: id,
                gradient: [Color(hex: "#FFB347"), Color(hex: "#FF9500")],
                background: Color(hex: "#FFF8F3"),
                textPrimary: .white,
                textSecondary: Color.white.opacity(0.85),
                badge: Color.white.opacity(0.85),
                card: Color.white.opacity(0.9)
            )
        case "minimal":
            return WidgetTheme(
                id: id,
                gradient: [Color(hex: "#FFFFFF"), Color(hex: "#FFF5EE")],
                background: Color(hex: "#FFFFFF"),
                textPrimary: Color(hex: "#1A1A2E"),
                textSecondary: Color(hex: "#6D6D8A"),
                badge: Color(hex: "#FFF5EE"),
                card: Color(hex: "#FFFFFF")
            )
        case "dark":
            return WidgetTheme(
                id: id,
                gradient: [Color(hex: "#151521"), Color(hex: "#25253B")],
                background: Color(hex: "#1F1F30"),
                textPrimary: .white,
                textSecondary: Color.white.opacity(0.75),
                badge: Color(hex: "#2A2A42"),
                card: Color(hex: "#25253B")
            )
        default:
            return WidgetTheme(
                id: "coral",
                gradient: [Color(hex: "#FF6B6B"), Color(hex: "#FFB4B4")],
                background: Color(hex: "#FFF8F3"),
                textPrimary: .white,
                textSecondary: Color.white.opacity(0.85),
                badge: Color.white.opacity(0.85),
                card: Color.white.opacity(0.9)
            )
        }
    }
}

// MARK: - Widget Views

struct LoopWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var theme: WidgetTheme { WidgetTheme.from(entry.themeId) }
    var style: WidgetStyle { WidgetStyle.from(entry.styleId) }

    var body: some View {
        switch family {
        case .systemSmall:
            smallWidget
        case .systemMedium:
            mediumWidget
        case .systemLarge:
            largeWidget
        default:
            smallWidget
        }
    }

    // MARK: - Small Widget

    var smallWidget: some View {
        ZStack {
            LinearGradient(
                colors: theme.gradient,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 8) {
                if let friendName = entry.friendName {
                    HStack(spacing: 6) {
                        Image(systemName: moodSymbol(for: entry))
                            .font(.system(size: 24, weight: .semibold))
                            .foregroundColor(theme.textPrimary)
                        Text(friendName)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(theme.textPrimary)
                            .lineLimit(1)
                    }
                } else {
                    Image(systemName: moodSymbol(for: entry))
                        .font(.system(size: 32, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                }

                Spacer()

                if style != .compact {
                    if entry.unreadCount > 0 {
                        HStack(spacing: 6) {
                            Circle()
                                .fill(theme.badge)
                                .frame(width: 8, height: 8)
                            Text("\(entry.unreadCount) new")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(theme.textPrimary.opacity(0.9))
                        }
                    } else if let note = entry.moodNote {
                        Text(note)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(theme.textPrimary.opacity(0.9))
                            .lineLimit(2)
                    }
                }

                Text(entry.friendName != nil ? "Loop • \(entry.friendName!)" : "Loop")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(theme.textPrimary.opacity(0.6))
                    .lineLimit(1)
            }
            .padding(14)
        }
        .containerBackground(for: .widget) {
            theme.background
        }
    }

    // MARK: - Medium Widget

    var mediumWidget: some View {
        ZStack {
            theme.background

            HStack(spacing: 16) {
                VStack(alignment: .center, spacing: 8) {
                    Image(systemName: moodSymbol(for: entry))
                        .font(.system(size: 38, weight: .semibold))
                        .foregroundColor(theme.textPrimary)

                    if let friendName = entry.friendName {
                        Text(friendName)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(theme.textPrimary)
                            .lineLimit(1)
                    }

                    if let note = entry.moodNote, style != .compact {
                        Text(note)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(theme.textSecondary)
                            .lineLimit(2)
                            .multilineTextAlignment(.center)
                    }
                }
                .frame(width: 100)

                Rectangle()
                    .fill(theme.textSecondary.opacity(0.15))
                    .frame(width: 1)

                VStack(alignment: .leading, spacing: 10) {
                    if style != .compact {
                        HStack(spacing: 16) {
                            if entry.friendName == nil {
                                StatBadge(value: entry.friendCount, label: "Friends", color: theme.textPrimary)
                            }
                            if entry.unreadCount > 0 {
                                StatBadge(value: entry.unreadCount, label: "New", color: theme.textPrimary)
                            }
                        }
                    }

                    Spacer()

                    if let content = entry.content, style != .compact {
                        HStack(spacing: 8) {
                            Circle()
                                .fill(theme.badge)
                                .frame(width: 32, height: 32)
                                .overlay(
                                    Image(systemName: contentTypeSymbol(content.type))
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(theme.textPrimary)
                                )

                            VStack(alignment: .leading, spacing: 2) {
                                Text(entry.friendName ?? content.senderName)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(theme.textPrimary)
                                Text("sent a \(content.type)")
                                    .font(.system(size: 11))
                                    .foregroundColor(theme.textSecondary)
                            }
                        }
                    }

                    HStack {
                        Spacer()
                        Text("Loop")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(theme.textSecondary.opacity(0.6))
                    }
                }
                .padding(.vertical, 4)
            }
            .padding(14)
        }
        .containerBackground(for: .widget) {
            theme.background
        }
    }

    // MARK: - Large Widget

    var largeWidget: some View {
        ZStack {
            theme.background

            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    HStack(spacing: 12) {
                        Image(systemName: moodSymbol(for: entry))
                            .font(.system(size: 30, weight: .semibold))
                            .foregroundColor(theme.textPrimary)

                        VStack(alignment: .leading, spacing: 2) {
                            if let friendName = entry.friendName {
                                Text(friendName)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(theme.textPrimary)
                            } else {
                                Text("Your Mood")
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(theme.textPrimary)
                            }
                            if let note = entry.moodNote {
                                Text(note)
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundColor(theme.textSecondary)
                                    .lineLimit(1)
                            }
                        }
                    }

                    Spacer()

                    if entry.unreadCount > 0 {
                        ZStack {
                            Circle()
                                .fill(theme.badge)
                                .frame(width: 36, height: 36)
                            Text("\(entry.unreadCount)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(theme.textPrimary)
                        }
                    }
                }
                .padding(14)
                .background(theme.card)
                .cornerRadius(16)

                if entry.friendName == nil && style != .compact {
                    HStack(spacing: 12) {
                        LargeStatCard(value: entry.friendCount, label: "Friends", color: theme.textPrimary, icon: "person.2.fill")
                        LargeStatCard(value: entry.unreadCount, label: "Updates", color: theme.textPrimary, icon: "bell.fill")
                    }
                }

                Spacer()

                VStack(alignment: .leading, spacing: 12) {
                    Text(entry.friendName != nil ? "LATEST FROM \(entry.friendName!.uppercased())" : "RECENT ACTIVITY")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(theme.textSecondary)

                    if let content = entry.content, style != .compact {
                        ContentRow(content: content, accentColor: theme.badge, friendName: entry.friendName, textColor: theme.textPrimary, secondaryColor: theme.textSecondary)
                    } else {
                        HStack {
                            Spacer()
                            VStack(spacing: 8) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 28, weight: .semibold))
                                    .foregroundColor(theme.textSecondary)
                                Text(entry.friendName != nil ? "No updates from \(entry.friendName!)" : "No new content yet")
                                    .font(.system(size: 13))
                                    .foregroundColor(theme.textSecondary)
                            }
                            Spacer()
                        }
                        .padding(.vertical, 24)
                    }
                }

                HStack {
                    Text("Loop")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(theme.textSecondary.opacity(0.6))
                    Spacer()
                    if style == .full {
                        Text("Tap to open")
                            .font(.system(size: 10))
                            .foregroundColor(theme.textSecondary.opacity(0.6))
                    }
                }
            }
            .padding(16)
        }
        .containerBackground(for: .widget) {
            theme.background
        }
    }

    // Helper function for mood symbol
    func moodSymbol(for entry: LoopEntry) -> String {
        if let content = entry.content {
            return contentTypeSymbol(content.type)
        }
        return "sparkles"
    }
}

// MARK: - Helper Functions

/// Returns an SF Symbol name for the given content type
func contentTypeSymbol(_ type: String) -> String {
    switch type {
    case "doodle": return "paintpalette.fill"
    case "mood": return "face.smiling"
    case "photo": return "photo.fill"
    case "voice": return "mic.fill"
    case "game": return "gamecontroller.fill"
    default: return "sparkles"
    }
}

// MARK: - Subviews

struct StatBadge: View {
    let value: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(color)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(color.opacity(0.7))
        }
    }
}

struct LargeStatCard: View {
    let value: Int
    let label: String
    let color: Color
    let icon: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(color)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(value)")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(color)
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(color.opacity(0.7))
            }

            Spacer()
        }
        .padding(12)
        .background(Color.white.opacity(0.6))
        .cornerRadius(12)
    }
}

struct ContentRow: View {
    let content: LoopContent
    let accentColor: Color
    var friendName: String? = nil
    let textColor: Color
    let secondaryColor: Color

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(accentColor)
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: contentTypeSymbol(content.type))
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(textColor)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(friendName ?? content.senderName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(textColor)
                Text("sent a \(content.type)")
                    .font(.system(size: 12))
                    .foregroundColor(secondaryColor)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(secondaryColor.opacity(0.6))
        }
        .padding(12)
        .background(Color.white.opacity(0.5))
        .cornerRadius(12)
    }
}

// MARK: - Widget Configuration

@main
struct LoopWidget: Widget {
    let kind: String = "LoopWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SelectFriendIntent.self, provider: Provider()) { entry in
            LoopWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Loop")
        .description("Stay connected with your friends")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    LoopWidget()
} timeline: {
    LoopEntry(date: .now, content: nil, mood: "sparkles", moodNote: "Feeling great!", friendName: nil, friendCount: 5, unreadCount: 2, themeId: "coral", styleId: "standard")
}

#Preview(as: .systemMedium) {
    LoopWidget()
} timeline: {
    LoopEntry(
        date: .now,
        content: LoopContent(
            id: "1",
            type: "doodle",
            senderName: "Alex",
            senderAvatar: nil,
            emoji: nil,
            note: nil,
            imageUrl: nil,
            createdAt: "2026-01-14T12:00:00Z"
        ),
        mood: "sparkles",
        moodNote: "Happy today!",
        friendName: "Alex",
        friendCount: 1,
        unreadCount: 1,
        themeId: "coral",
        styleId: "standard"
    )
}

#Preview(as: .systemLarge) {
    LoopWidget()
} timeline: {
    LoopEntry(
        date: .now,
        content: LoopContent(
            id: "1",
            type: "mood",
            senderName: "Jordan",
            senderAvatar: nil,
            emoji: nil,
            note: "Living the dream",
            imageUrl: nil,
            createdAt: "2026-01-14T12:00:00Z"
        ),
        mood: "sparkles",
        moodNote: "Ready for adventure",
        friendName: "Jordan",
        friendCount: 1,
        unreadCount: 1,
        themeId: "coral",
        styleId: "full"
    )
}

// MARK: - Utilities

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (1, 1, 1)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}
