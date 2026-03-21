# SmartFridge — iOS App

Native iOS SwiftUI port of the Smart Fridge Recipe Recommendation System web app.

---

## Requirements

| Tool | Version |
|------|---------|
| macOS | 13 Ventura or later |
| Xcode | 15.0 or later |
| iOS Simulator / Device | iOS 17.0+ |
| xcodegen | 2.x (`brew install xcodegen`) |

---

## First-time Setup

### 1. Generate the Xcode project

The repo ships a `project.yml` instead of a committed `.xcodeproj`. From inside `SmartFridge/`:

```bash
cd SmartFridge
xcodegen generate
```

This produces `SmartFridge.xcodeproj`. Open it in Xcode.

### 2. Add the Supabase Swift SDK

In Xcode: **File → Add Package Dependencies…**
- URL: `https://github.com/supabase-community/supabase-swift`
- Dependency rule: **Up to Next Major Version**, `2.0.0`
- Add to target: **SmartFridge**

> The `project.yml` already declares this dependency so `xcodegen generate` may resolve it automatically if your Xcode + SPM environment supports it. If the package is not resolved, add it manually as above.

### 3. Set the Supabase anonymous key

The anon key is intentionally excluded from source control. Set it as a build setting:

1. Select the **SmartFridge** project → **SmartFridge** target → **Build Settings**
2. Add a User-Defined setting named `SUPABASE_ANON_KEY` with the value from your Supabase project dashboard
3. The `Info.plist` template already reads `$(SUPABASE_ANON_KEY)` — no further changes needed

Alternatively, create `SmartFridge/Secrets.xcconfig`:
```
SUPABASE_ANON_KEY = eyJhbGci...
```
and reference it in the project's configuration if your team prefers xcconfig files.

### 4. Select a simulator and run

```
Product → Run  (⌘R)
```

Target: **iPhone 15** (iOS 17.0) or any iOS 17+ device/simulator.

---

## Building and Testing

```bash
# Build only
xcodebuild build \
  -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15'

# Run the full test suite
xcodebuild test \
  -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15'

# Run a single test class
xcodebuild test \
  -scheme SmartFridge \
  -destination 'platform=iOS Simulator,OS=17.0,name=iPhone 15' \
  -only-testing SmartFridgeTests/ModelTests
```

Install `xcpretty` for readable output: `gem install xcpretty` then pipe through `| xcpretty`.

---

## Project Structure

```
SmartFridge/
├── project.yml                  ← xcodegen spec (source of truth for the project)
├── SmartFridge/
│   ├── App/                     ← @main entry point, ContentView, TabView
│   ├── Config/                  ← Reads SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL from Info.plist
│   ├── Constants/               ← CuisineOption, dietary/allergy lists, storage keys
│   ├── Models/                  ← All Codable structs (Family, FamilyMember, InventoryItem, …)
│   ├── Managers/                ← ThemeManager, LanguageManager (@Observable)
│   ├── Services/                ← SupabaseService, RecipeAPIService, InventoryAPIService
│   ├── ViewModels/              ← AppViewModel, PlanningViewModel, ShoppingViewModel
│   ├── Views/
│   │   ├── Onboarding/          ← 8-step wizard with typewriter animations
│   │   ├── Inventory/           ← Fridge tab: list, search, camera picker, scan prompt
│   │   ├── Planning/            ← Food Ideas tab: recipe cards, recipe detail
│   │   ├── Shopping/            ← Shopping tab: grouped list, totals, clear bought
│   │   └── Shared/              ← TopBarView, CardView, PillView
│   └── Resources/
│       ├── en.lproj/
│       ├── zh-Hant.lproj/
│       ├── fil.lproj/
│       └── id.lproj/
└── SmartFridgeTests/            ← XCTest unit tests (models, services, view models)
```

---

## Web → iOS: What Changed

### Language and Framework

| Web | iOS |
|-----|-----|
| TypeScript + React 18 | Swift 5.9 + SwiftUI |
| Vite / browser environment | iOS 17 SDK |
| JSX component model | SwiftUI `View` protocol |
| CSS / Tailwind for styling | `ThemeColors` struct with `Color(hex:)` values |

### State Management

| Web | iOS |
|-----|-----|
| React Context + Zustand | `@Observable` view models injected via `.environment()` |
| `useEffect` for side effects | `.task` / `.onAppear` modifiers |
| `useState` / `useReducer` | `@State`, stored properties on `@Observable` class |
| Context Provider tree | `SmartFridgeApp` injects 4 environment objects at root |

The iOS app uses three `@Observable @MainActor` view models:
- **`AppViewModel`** — family, members, inventory, onboarding state
- **`PlanningViewModel`** — recipe recommendations and detail (created locally in `FoodIdeaView`)
- **`ShoppingViewModel`** — shopping list with realtime Supabase subscription

### Data Layer

| Web | iOS |
|-----|-----|
| `@supabase/supabase-js` | Supabase Swift SDK v2 (SPM) |
| `axios` / `fetch` for REST | `URLSession` async/await |
| `FormData` for image upload | Manually built multipart body |
| `supabase.channel()` for realtime | `client.realtimeV2.channel()` → `RealtimeChannelV2` |

The Swift SDK v2 uses `.execute().value` for auto-decoded typed responses — there is no manual `JSONDecoder` step for Supabase queries.

### Routing and Navigation

| Web | iOS |
|-----|-----|
| React Router v6 (`<Route>`, `useNavigate`) | `TabView` (3 tabs) + `NavigationStack` + `NavigationLink` |
| URL-based routing | Declarative SwiftUI navigation |
| Onboarding rendered conditionally in router | `ContentView` gates on `appVM.hasCompletedOnboarding` |

### Constants

The iOS constants mirror the web app (`src/constants/index.ts`) with these intentional adjustments:

- **Cuisine options** use the web app's lowercase `value` (e.g. `"chinese"`, `"cantonese"`) for API calls, with a capitalised `label` for display — matching what the backend expects.
- **Dietary restrictions** match the web app: added Pescatarian, Low Sodium, Low Sugar, Low Fat, Keto; removed Nut-Free, Shellfish-Free, Dairy-Free.
- **Health conditions** match the web app: added Gout; removed Lactose Intolerance.
- **Budget ranges** use the web app's `value` keys (`"low"`, `"medium"`, `"high"`) with HK$-denominated display labels.
- **UserDefaults keys** match the web app's `STORAGE_KEYS` exactly (`"smart-fridge-onboarding"`, `"smart-fridge-initialized"`) to allow data portability if a shared iCloud layer is added later.

### Localisation

| Web | iOS |
|-----|-----|
| `src/translations/index.ts` — runtime JS object | `Localizable.strings` per `.lproj` folder |
| `t(key, lang)` helper function | `String(localized: "key")` / `NSLocalizedString` |
| Language stored in Supabase family preferences | `LanguageManager` persists to UserDefaults; `zh-HK` maps to `zh-Hant.lproj` |

Four locales: `en`, `zh-Hant` (Traditional Chinese), `fil` (Filipino), `id` (Bahasa Indonesia).

### Camera / Image Upload

| Web | iOS |
|-----|-----|
| `<input type="file" accept="image/*" capture>` | `PhotosPicker` (up to 3 images) + `UIImagePickerController` (camera) |
| `FormData.append('images', blob)` | Manually built multipart/form-data with `--boundary` |

`UIImagePickerController` for camera is technically deprecated in iOS 17+ in favour of `AVCaptureSession`, but remains functional. A future iteration can replace `CameraCaptureBridge` with a proper `AVCaptureSession` wrapper if needed.

### Features Not Yet Ported

- **Push notifications** — the web app has none; a future version could add APNs.
- **Offline cache** — the web app uses no offline cache; a future version could persist inventory to Core Data or SwiftData.
- **Deep linking** — not implemented.

---

## Endpoints

The app talks to two backends:

| Backend | Base URL |
|---------|----------|
| Supabase | `https://dpgxcyktcptsnihpitjr.supabase.co` (in `Info.plist`) |
| Recipe/Inventory API | `http://152.42.221.192:8000` (in `Info.plist` as `API_BASE_URL`) |

Both URLs are baked into `Info.plist` via `project.yml`. To point at a different API host, change `API_BASE_URL` in `project.yml` and re-run `xcodegen generate`.

> **Note:** The API base URL uses HTTP, not HTTPS. Xcode will block non-HTTPS connections by default via App Transport Security. A `NSAppTransportSecurity` exception for `152.42.221.192` is included in `Info.plist` (via `project.yml`) to allow this connection.

---

## Re-generating the Project

Any time `project.yml` changes (new files, new build settings, new SPM dependencies), re-run:

```bash
cd SmartFridge
xcodegen generate
```

Do not manually edit `SmartFridge.xcodeproj` — it is not committed and will be overwritten by xcodegen. All project configuration lives in `project.yml`.
