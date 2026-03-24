# Smart Fridge - Technical Architecture Overview

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '18px'}}}%%

flowchart LR
    subgraph C["🟢 CLIENT<br/>━━━━━━━━━━━━━━━"]
        direction TB
        C1["📱 <b>React 18 PWA</b><br/>TypeScript 5.0<br/>Vite 5.0"]
        C2["📷 <b>Camera API</b><br/>MediaDevices<br/>Image Capture"]
        C3["🔄 <b>State</b><br/>Context API<br/>LocalStorage"]
        C1 --- C2
        C2 --- C3
    end
    
    subgraph S["🟣 SERVER<br/>━━━━━━━━━━━━━━━"]
        direction TB
        S1["⚙️ <b>FastAPI</b><br/>Python 3.11<br/>Async/Await"]
        S2["📡 <b>4 Endpoints</b><br/>REST API<br/>JSON Response"]
        S3["🛡️ <b>Middleware</b><br/>CORS • Rate Limit<br/>Validation"]
        S1 --- S2
        S2 --- S3
    end
    
    subgraph A["🔴 AI ENGINE<br/>━━━━━━━━━━━━━━━"]
        direction TB
        A1["👁️ <b>GPT-4 Vision</b><br/>Image Analysis<br/>Food Detection"]
        A2["🔍 <b>Recipe Matcher</b><br/>Fuzzy Search<br/>Diet Filter"]
        A3["💰 <b>Cost Engine</b><br/>Price Lookup<br/>Budget Calc"]
        A1 --- A2
        A2 --- A3
    end
    
    subgraph D["🟠 DATABASE<br/>━━━━━━━━━━━━━━━"]
        direction TB
        D1["🗄️ <b>PostgreSQL 15</b><br/>5 Tables<br/>UUID Keys"]
        D2["⚡ <b>Realtime</b><br/>WebSocket<br/>Live Sync"]
        D3["🔐 <b>Security</b><br/>RLS Policies<br/>Encryption"]
        D1 --- D2
        D2 --- D3
    end

    C -->|"HTTPS POST<br/>multipart/form-data"| S
    S -->|"OpenAI API<br/>Base64 Image"| A
    S <-->|"Supabase SDK<br/>PostgREST"| D
    D -->|"WebSocket<br/>postgres_changes"| C

    style C fill:#1a7f37,stroke:#3fb950,stroke-width:4px,color:#fff
    style S fill:#6e40c9,stroke:#a371f7,stroke-width:4px,color:#fff
    style A fill:#b62324,stroke:#f85149,stroke-width:4px,color:#fff
    style D fill:#9a6700,stroke:#d4a72c,stroke-width:4px,color:#fff
```

---

## API Specification

```mermaid
%%{init: {'theme': 'base'}}%%

flowchart LR
    subgraph API["📡 API ENDPOINTS @ 159.223.45.101:8000"]
        direction TB
        
        E1["<b>POST</b> /api/inventory/initialize<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>📥 Input: multipart/form-data (images[])<br/>📤 Output: {detected_items[], processing_time}<br/>⏱️ Timeout: 30s │ 🔄 Retry: 3x"]
        
        E2["<b>POST</b> /api/recipes/recommend<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>📥 Input: {member_ids[], cuisine_style}<br/>📤 Output: {recipes[], match_scores[]}<br/>💾 Cache: 5min TTL │ 📊 Max: 10 results"]
        
        E3["<b>GET</b> /api/recipes/{recipe_id}<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>📥 Input: UUID path parameter<br/>📤 Output: {name, steps[], ingredients[]}<br/>📦 Includes: missing_ingredients, alternatives"]
        
        E4["<b>POST</b> /api/recipes/{id}/add-to-cart<br/>━━━━━━━━━━━━━━━━━━━━━━━━━━<br/>📥 Input: UUID path parameter<br/>📤 Output: {added_items[], total_cost}<br/>🔒 Transaction: ACID compliant"]
    end

    style API fill:#1e1e2e,stroke:#a371f7,stroke-width:3px,color:#cdd6f4
```

---

## Database Schema

```mermaid
%%{init: {'theme': 'base'}}%%

erDiagram
    families ||--o{ family_members : "has"
    families ||--o{ inventory_items : "owns"
    families ||--o{ saved_recipes : "saves"
    families ||--o{ shopping_list_items : "creates"

    families {
        uuid id PK
        text name
        enum cooking_skill_level
        enum budget_range
        enum preferred_language
        timestamptz created_at
    }

    family_members {
        uuid id PK
        uuid family_id FK
        text name
        int age
        text[] dietary_restrictions
        text[] allergies
    }

    inventory_items {
        uuid id PK
        uuid family_id FK
        text name
        enum category
        numeric quantity
        date expiry_date
    }

    saved_recipes {
        uuid id PK
        uuid family_id FK
        jsonb recipe_data
        text cuisine_style
        int matched_count
        numeric estimated_cost
    }

    shopping_list_items {
        uuid id PK
        uuid family_id FK
        text name
        numeric quantity
        text unit
        boolean is_purchased
        text[] alternatives
    }
```

---

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.2 | UI Components |
| | TypeScript | 5.0 | Type Safety |
| | Vite | 5.0 | Build Tool |
| | TailwindCSS | 3.4 | Styling |
| **Backend** | FastAPI | 0.100+ | REST API |
| | Python | 3.11 | Runtime |
| | Uvicorn | Latest | ASGI Server |
| | Pydantic | v2 | Validation |
| **AI/ML** | GPT-4 Vision | Latest | Image Recognition |
| | OpenAI SDK | Latest | API Client |
| **Database** | PostgreSQL | 15 | Primary DB |
| | Supabase | Latest | BaaS Platform |
| **Infra** | DigitalOcean | - | Cloud Hosting |
| | Nginx | Latest | Reverse Proxy |


