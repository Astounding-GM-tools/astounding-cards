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
      name: "Dr. Ambrose Gristlethwaite",
      role: "Appalachian Consolidated Mining Company: CEO, Director of Research, and Chairman of the Board",
      age: "63",
      portrait: "gristlethwaite.jpg",
      traits: [
        "Arranges desk items at perfect right angles",
        "Checks pocket watch exactly every 15 minutes",
        "Never raises voice above conversational level"
      ],
      bio: "Third-generation mining executive who transformed ACMC from a family business into a ruthless corporate entity. Under his leadership, the company has seen record profits, but at the cost of worker safety and environmental concerns. Knows about the true nature of what was found in Shaft 9."
    },
    {
      id: "2",
      name: "Eleanor Blackwood",
      role: "ACMC Head of Operations and Chief Safety Compliance Officer",
      age: "45",
      portrait: null,
      traits: [
        "Takes photos of every violation with vintage camera",
        "Memorizes employee schedules down to the minute",
        "Wears steel-tipped boots in the office"
      ],
      bio: "Rising star at ACMC, Eleanor worked her way up from safety inspector to head of operations. She's known for implementing strict productivity metrics and reducing 'unnecessary' safety protocols. Has evidence of illegal disposal practices that she uses as leverage."
    },
    {
      id: "3",
      name: "Marcus Thane",
      role: "ACMC Director of Asset Protection and Special Operations",
      age: "52",
      portrait: null,
      traits: [
        "Polishes badge during conversations",
        "Uses military time exclusively",
        "Keeps detailed logs of every door opening"
      ],
      bio: "Former special forces operator who now runs ACMC's expansive security force. Has transformed company security from basic guard service to a paramilitary operation. Operates unofficial detention facilities for 'problem solving'."
    },
    {
      id: "4",
      name: "Dr. Sarah Chen",
      role: "ACMC Director of Experimental Geology and Mineral Research",
      age: "39",
      portrait: null,
      traits: [
        "Labels everything with hazard classifications",
        "Carries Geiger counter in purse",
        "Records observations in cryptic shorthand"
      ],
      bio: "Brilliant geologist turned research director, Dr. Chen leads ACMC's classified research division. Her work focuses on unusual mineral formations and their unique properties. Recently discovered unstable properties in Shaft 9 samples that could revolutionize energy production - or worse."
    },
    {
      id: "5",
      name: "James Cooper",
      role: "ACMC Director of Human Resources and Employee Relations",
      age: "48",
      portrait: null,
      traits: [
        "Keeps candy bowl filled with recording devices",
        "Writes employee names in red ink",
        "Schedules meetings for 4:57 PM on Fridays"
      ],
      bio: "A specialist in union-busting and worker manipulation, Cooper maintains the facade of a friendly HR director while ruthlessly suppressing any worker organization attempts. Keeps detailed files on every employee's personal weaknesses."
    },
    {
      id: "6",
      name: "Victoria Wells",
      role: "ACMC Director of Public Affairs and Community Engagement",
      age: "36",
      portrait: null,
      traits: [
        "Practices smiles in reflective surfaces",
        "Keeps newspaper clippings of accidents",
        "Answers questions with questions"
      ],
      bio: "A master of spin and media manipulation, Victoria ensures ACMC maintains its public image as a responsible corporate citizen while burying any negative stories. Has orchestrated cover-ups of multiple fatal accidents and environmental disasters."
    },
    {
      id: "7",
      name: "Robert Martinez",
      role: "ACMC Chief Mining Operations Supervisor, Shafts 7-9",
      age: "55",
      portrait: null,
      traits: [
        "Hands shake when signing safety forms",
        "Keeps old helmet with blast marks",
        "Draws maps on napkins at the bar"
      ],
      bio: "A longtime employee who worked his way up from the mines, Bob struggles with implementing policies he knows are dangerous while trying to protect his workers where he can. Has seen too many deaths and keeps secret maps of the old tunnels."
    },
    {
      id: "8",
      name: "William Strickland",
      role: "ACMC Chief Financial Officer and Corporate Controller",
      age: "58",
      portrait: null,
      traits: [
        "Uses seven different colored pens",
        "Keeps packed suitcase under desk",
        "Mumbles numbers while walking"
      ],
      bio: "The financial wizard behind ACMC's complex web of shell companies and tax avoidance schemes. Ensures the company's darker dealings remain hidden from public records. Has offshore accounts prepared for quick escape if needed."
    },
    {
      id: "9",
      name: "Dr. Thomas Reid",
      role: "ACMC Chief Medical Officer and Director of Occupational Health",
      age: "61",
      portrait: null,
      traits: [
        "Prescription pad has carbon paper underneath",
        "Locks filing cabinet seven times",
        "Studies x-rays after hours alone"
      ],
      bio: "Once a respected physician, Dr. Reid now serves as ACMC's medical director, helping cover up occupational diseases and falsifying health reports. Has proof of mutations in miners exposed to Shaft 9 materials but fears the consequences of coming forward."
    }
  ]
}; 