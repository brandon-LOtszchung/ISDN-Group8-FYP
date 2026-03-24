# Smart Fridge System Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0d1117', 'primaryTextColor': '#fff', 'primaryBorderColor': '#30363d', 'lineColor': '#58a6ff', 'fontSize': '16px'}}}%%

flowchart TB
    subgraph CLIENT["🟢 CLIENT LAYER"]
        style CLIENT fill:#1a7f37,stroke:#2ea043,stroke-width:3px,color:#fff
        direction TB
        
        subgraph MOBILE["📱 Progressive Web App"]
            style MOBILE fill:#238636,stroke:#3fb950,stroke-width:2px
            M1["⚛️ React 18 + TypeScript"]
            M2["⚡ Vite 5 Build System"]
            M3["🎨 TailwindCSS Styling"]
        end
        
        subgraph FEATURES["🔧 Core Features"]
            style FEATURES fill:#238636,stroke:#3fb950,stroke-width:2px
            F1["📷 Camera Integration<br/>MediaDevices API"]
            F2["🔄 State Management<br/>React Context"]
            F3["🌐 i18n Support<br/>EN | 繁體 | FIL | ID"]
        end
    end

    subgraph API["🟣 API GATEWAY LAYER"]
        style API fill:#6e40c9,stroke:#8957e5,stroke-width:3px,color:#fff
        direction TB
        
        subgraph SERVER["⚙️ FastAPI Server"]
            style SERVER fill:#8250df,stroke:#a371f7,stroke-width:2px
            S1["🐍 Python 3.11 Runtime"]
            S2["🦄 Uvicorn ASGI"]
            S3["📊 Pydantic Validation"]
        end
        
        subgraph ENDPOINTS["📡 REST Endpoints"]
            style ENDPOINTS fill:#8250df,stroke:#a371f7,stroke-width:2px
            E1["POST /api/inventory/initialize<br/>📷 Images → 🥬 Detected Items"]
            E2["POST /api/recipes/recommend<br/>👥 Members + 🍜 Cuisine → 📋 Recipes"]
            E3["GET /api/recipes/{id}<br/>📖 Full Recipe with Steps"]
            E4["POST /api/recipes/{id}/add-to-cart<br/>🛒 Missing → Shopping List"]
        end
    end

    subgraph AI["🔴 AI/ML PROCESSING LAYER"]
        style AI fill:#b62324,stroke:#da3633,stroke-width:3px,color:#fff
        direction TB
        
        subgraph VISION["👁️ Computer Vision"]
            style VISION fill:#cf222e,stroke:#f85149,stroke-width:2px
            V1["🧠 GPT-4 Vision API"]
            V2["🔍 Food Recognition"]
            V3["📊 Quantity Estimation"]
        end
        
        subgraph ENGINE["🍳 Recipe Intelligence"]
            style ENGINE fill:#cf222e,stroke:#f85149,stroke-width:2px
            R1["🔗 Ingredient Matching"]
            R2["⚠️ Dietary Filtering"]
            R3["💰 Cost Calculation"]
            R4["⭐ Ranking Algorithm"]
        end
    end

    subgraph DATA["🟠 DATA PERSISTENCE LAYER"]
        style DATA fill:#9a6700,stroke:#bf8700,stroke-width:3px,color:#fff
        direction TB
        
        subgraph DB["🗄️ PostgreSQL 15"]
            style DB fill:#b58900,stroke:#d4a72c,stroke-width:2px
            D1["👨‍👩‍👧 families"]
            D2["👤 family_members"]
            D3["🥬 inventory_items"]
            D4["🍳 saved_recipes"]
            D5["🛒 shopping_list_items"]
        end
        
        subgraph SUPA["☁️ Supabase Platform"]
            style SUPA fill:#b58900,stroke:#d4a72c,stroke-width:2px
            SU1["🔐 Row Level Security"]
            SU2["📡 PostgREST API"]
            SU3["⚡ Realtime Engine"]
        end
    end

    subgraph INFRA["🔵 INFRASTRUCTURE"]
        style INFRA fill:#0550ae,stroke:#0969da,stroke-width:3px,color:#fff
        I1["🌊 DigitalOcean Droplet"]
        I2["🔒 SSL/TLS Encryption"]
        I3["🌐 Nginx Reverse Proxy"]
    end

    %% Main Flow Connections
    CLIENT -->|"HTTPS<br/>REST API"| API
    API -->|"OpenAI API<br/>GPT-4 Vision"| AI
    API <-->|"Supabase SDK<br/>PostgREST"| DATA
    CLIENT <-->|"WebSocket<br/>Realtime Sync"| SU3
    API --- INFRA

    %% Color-coded flow lines
    linkStyle 0 stroke:#3fb950,stroke-width:3px
    linkStyle 1 stroke:#f85149,stroke-width:3px
    linkStyle 2 stroke:#d4a72c,stroke-width:3px
    linkStyle 3 stroke:#d4a72c,stroke-width:3px
```

## Color Legend

| Color | Layer | Technologies |
|-------|-------|--------------|
| 🟢 Green | Client | React, TypeScript, Vite, TailwindCSS |
| 🟣 Purple | API | FastAPI, Python, Uvicorn, Pydantic |
| 🔴 Red | AI/ML | GPT-4 Vision, OpenAI API |
| 🟠 Orange | Database | PostgreSQL, Supabase |
| 🔵 Blue | Infrastructure | DigitalOcean, Nginx, SSL |

