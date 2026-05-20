import { useEffect } from 'react'

export default function DiagramsPage() {
  useEffect(() => {
    // Load Mermaid dynamically
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      window.mermaid?.initialize({
        startOnLoad: true,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#0d1117',
          primaryColor: '#238636',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#30363d',
          lineColor: '#58a6ff',
          secondaryColor: '#21262d',
          tertiaryColor: '#161b22',
          // ER Diagram specific
          attributeBackgroundColorOdd: '#21262d',
          attributeBackgroundColorEven: '#161b22',
          entityBorder: '#d4a72c',
          entityBkg: '#21262d',
        },
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        er: { useMaxWidth: true, entityPadding: 15 },
      })
      // @ts-ignore
      window.mermaid?.contentLoaded()
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      color: '#c9d1d9',
      padding: '40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Custom styles for ER diagram visibility */}
      <style>{`
        .er.entityBox {
          fill: #21262d !important;
          stroke: #d4a72c !important;
        }
        .er.entityLabel {
          fill: #ffffff !important;
        }
        .er.attributeBoxOdd {
          fill: #2d333b !important;
        }
        .er.attributeBoxEven {
          fill: #21262d !important;
        }
        .er text {
          fill: #c9d1d9 !important;
        }
        .er .relationshipLabel {
          fill: #c9d1d9 !important;
        }
        .er .relationshipLabelBox {
          fill: #0d1117 !important;
        }
        g.classGroup text {
          fill: #c9d1d9 !important;
        }
        rect.er {
          fill: #21262d !important;
        }
      `}</style>
      {/* Header */}
      <h1 style={{
        textAlign: 'center',
        fontSize: '2.5rem',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #58a6ff, #a371f7, #f78166)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        🍳 Smart Fridge System Diagrams
      </h1>
      <p style={{ textAlign: 'center', color: '#8b949e', marginBottom: '60px', fontSize: '1.1rem' }}>
        ISDN Group 8 - Final Year Project
      </p>

      {/* Diagram 0: Ultra Clean Overview (TOP) */}
      <DiagramSection 
        title="⚡ System Overview" 
        color="#58a6ff"
        diagram={`
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '18px'}}}%%
flowchart LR
    subgraph C["🟢 CLIENT"]
        direction TB
        C1["📱 React 18 PWA<br/>TypeScript 5.0<br/>Vite 5.0"]
        C2["📷 Camera API<br/>Image Capture"]
        C3["🔄 Context API<br/>State Mgmt"]
    end
    
    subgraph S["🟣 SERVER"]
        direction TB
        S1["⚙️ FastAPI<br/>Python 3.11<br/>Async I/O"]
        S2["📡 4 REST APIs<br/>JSON Response"]
        S3["🛡️ Middleware<br/>CORS + Validation"]
    end
    
    subgraph A["🔴 AI ENGINE"]
        direction TB
        A1["👁️ GPT-4 Vision<br/>Food Detection"]
        A2["🔍 Recipe Matcher<br/>Diet Filter"]
        A3["💰 Cost Engine<br/>Budget Calc"]
    end
    
    subgraph D["🟠 DATABASE"]
        direction TB
        D1["🗄️ PostgreSQL 15<br/>5 Tables"]
        D2["⚡ Realtime<br/>WebSocket"]
        D3["🔐 RLS Security<br/>Encryption"]
    end

    C -->|"HTTPS POST"| S
    S -->|"OpenAI API"| A
    S <-->|"Supabase SDK"| D
    D -->|"WebSocket"| C

    style C fill:#1a7f37,stroke:#3fb950,stroke-width:4px,color:#fff
    style S fill:#6e40c9,stroke:#a371f7,stroke-width:4px,color:#fff
    style A fill:#b62324,stroke:#f85149,stroke-width:4px,color:#fff
    style D fill:#9a6700,stroke:#d4a72c,stroke-width:4px,color:#fff
        `}
        legend={[
          { color: '#3fb950', label: 'Client Layer' },
          { color: '#a371f7', label: 'Server Layer' },
          { color: '#f85149', label: 'AI Layer' },
          { color: '#d4a72c', label: 'Data Layer' },
        ]}
      />

      {/* Features Overview */}
      <div style={{
        background: '#21262d',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '60px',
        border: '1px solid #30363d'
      }}>
        <h2 style={{ color: '#58a6ff', marginBottom: '20px', fontSize: '1.5rem' }}>🚀 Key Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <FeatureCard icon="📷" title="Smart Fridge Scanning" desc="AI-powered food detection from photos" />
          <FeatureCard icon="🍳" title="Recipe Recommendations" desc="Personalized recipes based on inventory" />
          <FeatureCard icon="👨‍👩‍👧‍👦" title="Family Profiles" desc="Dietary restrictions & allergy management" />
          <FeatureCard icon="🛒" title="Shopping List" desc="Auto-generated with real-time sync" />
          <FeatureCard icon="💰" title="Budget Tracking" desc="Cost estimation for recipes" />
          <FeatureCard icon="🌐" title="Multi-language" desc="EN, 繁體中文, Filipino, Indonesian" />
        </div>
      </div>

      {/* Diagram 1: System Architecture */}
      <DiagramSection 
        title="🏗️ System Architecture Overview" 
        color="#3fb950"
        diagram={`
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#0d1117', 'primaryTextColor': '#fff', 'fontSize': '16px'}}}%%
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
            F1["📷 Camera Integration"]
            F2["🔄 State Management"]
            F3["🌐 i18n Support"]
        end
    end

    subgraph API["🟣 API GATEWAY"]
        style API fill:#6e40c9,stroke:#8957e5,stroke-width:3px,color:#fff
        direction TB
        
        subgraph SERVER["⚙️ FastAPI Server"]
            style SERVER fill:#8250df,stroke:#a371f7,stroke-width:2px
            S1["🐍 Python 3.11"]
            S2["🦄 Uvicorn ASGI"]
            S3["📊 Pydantic v2"]
        end
        
        subgraph ENDPOINTS["📡 REST Endpoints"]
            style ENDPOINTS fill:#8250df,stroke:#a371f7,stroke-width:2px
            E1["POST /inventory/initialize"]
            E2["POST /recipes/recommend"]
            E3["GET /recipes/{id}"]
            E4["POST /add-to-cart"]
        end
    end

    subgraph AI["🔴 AI/ML LAYER"]
        style AI fill:#b62324,stroke:#da3633,stroke-width:3px,color:#fff
        
        subgraph VISION["👁️ Computer Vision"]
            style VISION fill:#cf222e,stroke:#f85149,stroke-width:2px
            V1["🧠 GPT-4 Vision"]
            V2["🔍 Food Detection"]
        end
        
        subgraph ENGINE["🍳 Recipe Engine"]
            style ENGINE fill:#cf222e,stroke:#f85149,stroke-width:2px
            R1["🔗 Matching"]
            R2["⚠️ Diet Filter"]
            R3["💰 Cost Calc"]
        end
    end

    subgraph DATA["🟠 DATA LAYER"]
        style DATA fill:#9a6700,stroke:#bf8700,stroke-width:3px,color:#fff
        
        subgraph DB["🗄️ PostgreSQL"]
            style DB fill:#b58900,stroke:#d4a72c,stroke-width:2px
            D1["👨‍👩‍👧 families"]
            D2["👤 members"]
            D3["🥬 inventory"]
            D4["🍳 recipes"]
            D5["🛒 shopping"]
        end
        
        subgraph SUPA["☁️ Supabase"]
            style SUPA fill:#b58900,stroke:#d4a72c,stroke-width:2px
            SU1["🔐 RLS Security"]
            SU2["⚡ Realtime"]
        end
    end

    CLIENT -->|"HTTPS"| API
    API -->|"OpenAI API"| AI
    API <-->|"Supabase SDK"| DATA
    CLIENT <-->|"WebSocket"| SU2

    linkStyle 0 stroke:#3fb950,stroke-width:3px
    linkStyle 1 stroke:#f85149,stroke-width:3px
    linkStyle 2 stroke:#d4a72c,stroke-width:3px
    linkStyle 3 stroke:#d4a72c,stroke-width:3px
        `}
        legend={[
          { color: '#3fb950', label: 'Client (React)' },
          { color: '#a371f7', label: 'API (FastAPI)' },
          { color: '#f85149', label: 'AI/ML (GPT-4)' },
          { color: '#d4a72c', label: 'Database (PostgreSQL)' },
        ]}
      />

      {/* Diagram 2: Data Flow */}
      <DiagramSection 
        title="🔄 Data Flow Pipeline" 
        color="#3fb950"
        diagram={`
%%{init: {'theme': 'base'}}%%
flowchart LR
    subgraph INPUT["📥 INPUT"]
        A["📷 Fridge Photo"]
        B["👥 Family Prefs"]
    end

    subgraph PROCESS["⚡ AI PROCESSING"]
        C["🧠 GPT-4 Vision<br/>Image → Items"]
        D["🔍 Recipe Match<br/>Filter + Rank"]
        E["💰 Cost Calc<br/>Budget Check"]
    end

    subgraph OUTPUT["📤 OUTPUT"]
        F["📋 Recipe List"]
        G["🛒 Shopping List"]
    end

    A --> C
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G

    style INPUT fill:#238636,stroke:#3fb950,stroke-width:3px,color:#fff
    style PROCESS fill:#8250df,stroke:#a371f7,stroke-width:3px,color:#fff
    style OUTPUT fill:#b58900,stroke:#d4a72c,stroke-width:3px,color:#fff
        `}
      />

      {/* Diagram 4: User Flow */}
      <DiagramSection 
        title="👤 Complete User Flow" 
        color="#f778ba"
        diagram={`
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px'}}}%%
flowchart TB
    subgraph LAUNCH["🚀 APP LAUNCH"]
        style LAUNCH fill:#1e1e2e,stroke:#f5c2e7,stroke-width:3px,color:#fff
        START(("🏠 Open"))
        CHECK{"First<br/>Time?"}
        START --> CHECK
    end

    subgraph ONBOARD["✨ ONBOARDING"]
        style ONBOARD fill:#1e1e2e,stroke:#f5c2e7,stroke-width:3px,color:#fff
        O1["📝 Family Name"]
        O2["👨‍🍳 Cooking Skill"]
        O3["💰 Budget"]
        O4["👨‍👩‍👧 Members"]
        O5["🎉 Welcome!"]
        O1 --> O2 --> O3 --> O4 --> O5
    end

    subgraph MAIN["📱 MAIN APP"]
        style MAIN fill:#1e1e2e,stroke:#89b4fa,stroke-width:3px,color:#fff
        
        subgraph INV["🥬 INVENTORY TAB"]
            style INV fill:#1a7f37,stroke:#3fb950,stroke-width:2px,color:#fff
            I1["📦 View Items"]
            I2["📷 Scan Fridge"]
            I3["🔍 AI Detection"]
            I1 --> I2 --> I3 --> I1
        end
        
        subgraph PLAN["🍳 PLANNING TAB"]
            style PLAN fill:#6e40c9,stroke:#a371f7,stroke-width:2px,color:#fff
            P1["👥 Select Diners"]
            P2["🍜 Choose Cuisine"]
            P3["📋 Get Recipes"]
            P4["📖 Recipe Detail"]
            P5["🛒 Shopping List"]
            P1 --> P2 --> P3 --> P4 --> P5
        end
        
        INV <--> PLAN
    end

    CHECK -->|"Yes"| O1
    CHECK -->|"No"| MAIN
    O5 --> MAIN
        `}
      />

      {/* Diagram 5: Database Schema */}
      <DiagramSection 
        title="🗄️ Database Schema" 
        color="#d4a72c"
        diagram={`
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#b58900', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#d4a72c', 'lineColor': '#d4a72c', 'secondaryColor': '#21262d', 'tertiaryColor': '#161b22', 'background': '#0d1117', 'mainBkg': '#21262d', 'secondBkg': '#161b22', 'attributeBackgroundColorOdd': '#21262d', 'attributeBackgroundColorEven': '#161b22' }}}%%
erDiagram
    families ||--o{ family_members : "has"
    families ||--o{ inventory_items : "owns"
    families ||--o{ saved_recipes : "saves"
    families ||--o{ shopping_list_items : "creates"

    families {
        uuid id PK
        text name
        enum cooking_skill
        enum budget_range
        enum language
    }

    family_members {
        uuid id PK
        uuid family_id FK
        text name
        int age
        array restrictions
        array allergies
    }

    inventory_items {
        uuid id PK
        uuid family_id FK
        text name
        enum category
        numeric quantity
    }

    saved_recipes {
        uuid id PK
        uuid family_id FK
        jsonb recipe_data
        text cuisine_style
        numeric cost
    }

    shopping_list_items {
        uuid id PK
        uuid family_id FK
        text name
        numeric quantity
        boolean is_purchased
    }
        `}
      />

      {/* Diagram 6: API Endpoints */}
      <DiagramSection 
        title="📡 API Endpoints" 
        color="#a371f7"
        diagram={`
%%{init: {'theme': 'base'}}%%
flowchart LR
    subgraph CLIENT["📱 Client"]
        C1["Camera"]
        C2["Planning"]
    end

    subgraph API["⚙️ FastAPI @ 159.223.45.101:8000"]
        direction TB
        E1["POST /api/inventory/initialize<br/>📷 Images → 🥬 Items"]
        E2["POST /api/recipes/recommend<br/>👥 + 🍜 → 📋 Recipes"]
        E3["GET /api/recipes/{id}<br/>📖 Full Details"]
        E4["POST /api/recipes/{id}/add-to-cart<br/>🛒 Add Missing"]
    end

    subgraph DB["🗄️ Database"]
        D1["inventory"]
        D2["recipes"]
        D3["shopping"]
    end

    C1 --> E1
    C2 --> E2
    C2 --> E3
    C2 --> E4
    E1 --> D1
    E2 --> D2
    E4 --> D3

    style CLIENT fill:#238636,stroke:#3fb950,stroke-width:2px,color:#fff
    style API fill:#8250df,stroke:#a371f7,stroke-width:2px,color:#fff
    style DB fill:#b58900,stroke:#d4a72c,stroke-width:2px,color:#fff
        `}
      />

      {/* Back to App Link */}
      <div style={{ textAlign: 'center', marginTop: '60px', paddingBottom: '40px' }}>
        <a 
          href="/"
          style={{
            display: 'inline-block',
            padding: '16px 32px',
            background: 'linear-gradient(135deg, #58a6ff, #a371f7)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '16px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(88, 166, 255, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          ← Back to App
        </a>
      </div>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: '#161b22',
      borderRadius: '10px',
      padding: '20px',
      border: '1px solid #30363d',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '15px',
    }}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <div>
        <h3 style={{ color: '#fff', marginBottom: '5px', fontSize: '1rem' }}>{title}</h3>
        <p style={{ color: '#8b949e', fontSize: '0.9rem', margin: 0 }}>{desc}</p>
      </div>
    </div>
  )
}

// Diagram Section Component
function DiagramSection({ 
  title, 
  color, 
  diagram, 
  legend 
}: { 
  title: string
  color: string
  diagram: string
  legend?: { color: string; label: string }[]
}) {
  return (
    <div style={{ marginBottom: '80px' }}>
      <div style={{
        fontSize: '1.8rem',
        marginBottom: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #161b22, #21262d)',
        borderRadius: '12px',
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
      }}>
        {title}
      </div>
      
      <div style={{
        background: '#161b22',
        borderRadius: '16px',
        padding: '40px',
        border: '1px solid #30363d',
        overflowX: 'auto',
      }}>
        <pre className="mermaid" style={{ display: 'flex', justifyContent: 'center' }}>
          {diagram}
        </pre>
      </div>
      
      {legend && (
        <div style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
        }}>
          {legend.map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              background: '#21262d',
              borderRadius: '8px',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: item.color,
              }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

