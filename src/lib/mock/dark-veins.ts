import type { CharacterDeck } from '$lib/server/db/schema';

export const darkVeinsDeck: CharacterDeck = {
  meta: {
    campaignName: "The Dark Veins",
    deckName: "ACMC Management",
    deckNumber: 1,
    totalDecks: 3,
    description: "Employees of Appalachian Consolidated Mining Company",
    tags: ["Corporate", "Management", "Antagonists"],
    theme: {
      baseTheme: "corporate",
      customizations: {
        colors: {
          primary: "#1A1A1A",
          secondary: "#404040",
          accent: "#C41E3A",
          text: "#000000",
          background: "#FFFFFF"
        }
      }
    },
    version: "1.0"
  },
  characters: [
    {
      id: "1",
      name: "Ambrose Gristlethwaite",
      role: "CEO, ACMC",
          age: "63",
      portrait: "gristlethwaite.jpg",
      traits: {
        personality: [
          "Cold and calculating",
          "Obsessed with efficiency",
          "Dismissive of worker concerns"
        ],
        motivation: [
          "Maximize profits at any human cost",
          "Maintain family legacy",
          "Hide the truth about Shaft 9"
        ],
        appearance: [
          "Tall, gaunt man with steel-gray hair",
          "Wire-rimmed glasses",
          "Perfectly tailored charcoal suits",
          "Always carries a silver pocket watch"
        ]
      },
      details: {
        bio: "Third-generation mining executive who transformed ACMC from a family business into a ruthless corporate entity. Under his leadership, the company has seen record profits, but at the cost of worker safety and environmental concerns.",
        notes: [
          "Never visits mine sites personally",
          "Communicates only through intermediaries",
          "Keeps detailed records of all 'incidents'",
          "Has political connections in state government"
        ],
        connections: ["Eleanor Blackwood", "Marcus Thane", "Senator Williams"],
        secrets: "Knows about the true nature of what was found in Shaft 9"
      }
    },
    {
      id: "2",
      name: "Eleanor Blackwood",
      role: "Head of Operations",
      age: "45",
      traits: {
        personality: [
          "Ruthlessly efficient",
          "Detail-oriented",
          "Outwardly professional"
        ],
        motivation: [
          "Prove herself in male-dominated industry",
          "Secure her position in upper management",
          "Keep workers in line"
        ],
        appearance: [
          "Sharp business attire",
          "Red hair always in tight bun",
          "Permanent stern expression",
          "Carries multiple phones"
        ]
      },
      details: {
        bio: "Rising star at ACMC, Eleanor worked her way up from safety inspector to head of operations. She's known for implementing strict productivity metrics and reducing 'unnecessary' safety protocols.",
        notes: [
          "Maintains extensive surveillance system",
          "Keeps dirt on problematic employees",
          "Regular midnight inspections",
          "Has a network of informants"
        ],
        connections: ["Ambrose Gristlethwaite", "James Cooper", "Sarah Chen"],
        secrets: "Has evidence of illegal disposal practices"
      }
    },
    {
      id: "3",
      name: "Marcus Thane",
      role: "Security Chief",
      age: "52",
      traits: {
        personality: [
          "Ex-military rigid",
          "Follows orders without question",
          "Surprisingly diplomatic"
        ],
        motivation: [
          "Maintain order at any cost",
          "Protect company secrets",
          "Build his private security force"
        ],
        appearance: [
          "Military-style haircut",
          "Always in tactical gear",
          "Visible shoulder holster",
          "Scarred left cheek"
        ]
      },
      details: {
        bio: "Former special forces operator who now runs ACMC's expansive security force. Has transformed company security from basic guard service to a paramilitary operation.",
        notes: [
          "Runs 'special training' programs",
          "Has unmarked vehicles and personnel",
          "Monitors local law enforcement",
          "Controls access to restricted areas"
        ],
        connections: ["Ambrose Gristlethwaite", "Eleanor Blackwood", "Local Sheriff"],
        secrets: "Operates black sites for 'problem solving'"
      }
    },
    {
      id: "4",
      name: "Dr. Sarah Chen",
      role: "Research Director",
      age: "39",
      traits: {
        personality: [
          "Brilliant but amoral",
          "Focused on pure research",
          "Disdainful of regulations"
        ],
        motivation: [
          "Unlock Shaft 9's secrets",
          "Push boundaries of science",
          "Achieve academic recognition"
        ],
        appearance: [
          "Lab coat over designer clothes",
          "Geometric glasses",
          "Nervous energy",
          "Slight chemical burn scars on hands"
        ]
      },
      details: {
        bio: "Brilliant geologist turned research director, Dr. Chen leads ACMC's classified research division. Her work focuses on unusual mineral formations and their unique properties.",
        notes: [
          "Maintains secret lab facilities",
          "Works directly with military contacts",
          "Requires specialized containment equipment",
          "Regular unexplained deliveries"
        ],
        connections: ["Eleanor Blackwood", "James Cooper", "Military Liaison"],
        secrets: "Discovered unstable properties in Shaft 9 samples"
      }
    },
    {
      id: "5",
      name: "James Cooper",
      role: "HR Director",
      age: "48",
      traits: {
        personality: [
          "Superficially friendly",
          "Master manipulator",
          "Always gathering information"
        ],
        motivation: [
          "Prevent union formation",
          "Maintain worker compliance",
          "Advance within company"
        ],
        appearance: [
          "Disarming smile",
          "Business casual attire",
          "Seemingly warm demeanor",
          "Fidgets with wedding ring"
        ]
      },
      details: {
        bio: "A specialist in union-busting and worker manipulation, Cooper maintains the facade of a friendly HR director while ruthlessly suppressing any worker organization attempts.",
        notes: [
          "Runs employee surveillance program",
          "Maintains blacklist of activists",
          "Uses personal problems for leverage",
          "Creates internal conflicts"
        ],
        connections: ["Eleanor Blackwood", "Marcus Thane", "Local Media"],
        secrets: "Has list of 'disappeared' union organizers"
      }
    },
    {
      id: "6",
      name: "Victoria Wells",
      role: "Public Relations",
      age: "36",
      traits: {
        personality: [
          "Charismatic and polished",
          "Expert at deflection",
          "Internally cynical"
        ],
        motivation: [
          "Control the narrative",
          "Build political connections",
          "Advance personal career"
        ],
        appearance: [
          "Camera-ready appearance",
          "Expensive but conservative suits",
          "Perfect media-friendly smile",
          "Always camera-ready makeup"
        ]
      },
      details: {
        bio: "A master of spin and media manipulation, Victoria ensures ACMC maintains its public image as a responsible corporate citizen while burying any negative stories.",
        notes: [
          "Has journalists on payroll",
          "Maintains multiple cover stories",
          "Controls local news cycle",
          "Expert at crisis management"
        ],
        connections: ["Ambrose Gristlethwaite", "Local Media", "Politicians"],
        secrets: "Orchestrated cover-up of major accidents"
      }
    },
    {
      id: "7",
      name: "Robert Martinez",
      role: "Mine Supervisor",
      age: "55",
      traits: {
        personality: [
          "Torn between loyalty and conscience",
          "Increasingly drinking",
          "Avoiding responsibility"
        ],
        motivation: [
          "Protect his pension",
          "Minimize worker deaths",
          "Find redemption"
        ],
        appearance: [
          "Weather-beaten face",
          "Perpetually tired eyes",
          "Mixed gray hair",
          "Carries flask in jacket"
        ]
      },
      details: {
        bio: "A longtime employee who worked his way up from the mines, Bob struggles with implementing policies he knows are dangerous while trying to protect his workers where he can.",
        notes: [
          "Knows all the old tunnels",
          "Has seen too many deaths",
          "Keeps secret maps",
          "Looking for way out"
        ],
        connections: ["Eleanor Blackwood", "Miners", "James Cooper"],
        secrets: "Has evidence of deliberate safety violations"
      }
    },
    {
      id: "8",
      name: "William Strickland",
      role: "Financial Controller",
      age: "58",
      traits: {
        personality: [
          "Obsessive about details",
          "Paranoid about audits",
          "Loves complex schemes"
        ],
        motivation: [
          "Hide financial irregularities",
          "Protect company assets",
          "Secure his retirement"
        ],
        appearance: [
          "Expensive but old suits",
          "Constantly checks phone",
          "Nervous tics",
          "Stress-induced tremor"
        ]
      },
      details: {
        bio: "The financial wizard behind ACMC's complex web of shell companies and tax avoidance schemes, Bill ensures the company's darker dealings remain hidden from public records.",
        notes: [
          "Maintains multiple sets of books",
          "Has offshore accounts ready",
          "Knows all money trails",
          "Prepared for quick exit"
        ],
        connections: ["Ambrose Gristlethwaite", "Offshore Bankers", "Victoria Wells"],
        secrets: "Knows locations of all slush funds"
      }
    },
    {
      id: "9",
      name: "Dr. Thomas Reid",
      role: "Company Doctor",
      age: "61",
      traits: {
        personality: [
          "Formerly idealistic",
          "Now deeply cynical",
          "Drowning in guilt"
        ],
        motivation: [
          "Maintain medical license",
          "Hide evidence of health issues",
          "Find redemption"
        ],
        appearance: [
          "Disheveled white coat",
          "Shaking hands",
          "Deep eye bags",
          "Nicotine-stained fingers"
        ]
      },
      details: {
        bio: "Once a respected physician, Dr. Reid now serves as ACMC's medical director, helping cover up occupational diseases and falsifying health reports for the company.",
        notes: [
          "Keeps two sets of records",
          "Knows real death toll",
          "Has hidden tissue samples",
          "Considering whistleblowing"
        ],
        connections: ["Sarah Chen", "Bob Martinez", "Eleanor Blackwood"],
        secrets: "Has proof of mutation in miners"
      }
    }
  ]
}; 