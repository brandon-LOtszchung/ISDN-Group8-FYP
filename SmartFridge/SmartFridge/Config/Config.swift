// Config/Config.swift
import Foundation

enum Config {
    static let supabaseURL: String = {
        guard let v = Bundle.main.infoDictionary?["SUPABASE_URL"] as? String else {
            preconditionFailure("SUPABASE_URL missing from Info.plist")
        }
        return v
    }()
    static let supabaseAnonKey: String = {
        guard let v = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String else {
            preconditionFailure("SUPABASE_ANON_KEY missing from Info.plist")
        }
        return v
    }()
    static let apiBaseURL: String = {
        guard let v = Bundle.main.infoDictionary?["API_BASE_URL"] as? String else {
            preconditionFailure("API_BASE_URL missing from Info.plist")
        }
        return v
    }()
}
