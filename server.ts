import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY je vyžadován. Prosím, nastavte jej v nastavení (Secrets).");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper to get absolute path to content
const getContentPath = (type: string, slug: string) => {
  return path.join(process.cwd(), 'content', type, `${slug}.mdx`);
};

// API: List all content (alternative to Glob if needed, but let's keep it for now)
app.get("/api/content", async (req, res) => {
  try {
    const types = ['raperi', 'alba', 'skladby', 'labely', 'zanry', 'clanky'];
    const results = [];

    for (const type of types) {
      const dirPath = path.join(process.cwd(), 'content', type);
      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file.endsWith('.mdx')) {
            const content = await fs.readFile(path.join(dirPath, file), 'utf-8');
            results.push({ type, slug: file.replace('.mdx', ''), content });
          }
        }
      } catch (e) {
        // Directory might not exist yet
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// API: Save content
app.post("/api/content", async (req, res) => {
  const { type, slug, content } = req.body;
  if (!type || !slug || !content) {
    return res.status(400).json({ error: "Missing type, slug, or content" });
  }

  try {
    const filePath = getContentPath(type, slug);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// API: Delete content
app.delete("/api/content/:type/:slug", async (req, res) => {
  const { type, slug } = req.params;
  try {
    const filePath = getContentPath(type, slug);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// API: Generate content using Gemini with Search Grounding
app.post("/api/generate", async (req, res) => {
  const { type, query, provider, apiKey, model } = req.body;

  if (!type || !query) {
    return res.status(400).json({ error: "Missing type or query" });
  }

  try {
    const systemInstruction = `Jsi expert na český rap a hip-hop. Tvým úkolem je vyhledat pravdivé informace a vygenerovat MDX soubor pro entity typu: ${type}.
Vždy používej Google Search grounding k ověření faktů (datum narození, občanské jméno, diskografie, labely atd.).
Všechny informace musí být aktuální.

POVINNÁ FORMA VČETNĚ UVOZOVEK. VŠECHNY SLUGY MALÝMI PÍSMENY A BEZ MEZER. Slugy tvoř pouze pomocí malých písmen a pomlček (\`-\`), žádné mezery. Pole musí být camelCase. Všechna \`description\` pole jsou povinná a nesmí být prázdná string (""). Pod blokem \`---\` musí být vždy alespoň jeden odstavec textu.

Odpověz POUZE ve formátu MDX podle následující šablony. NEPŘIDÁVEJ žádné markdown bloky (nezačínej \`\`\`mdx). Odpověz JENOM čistým textem frontmatteru (--- ... ---) a následným textem.

# ŠABLONA PRO TYP: raperi
title: "Jméno Rappera" (povinné)
slug: "jmeno-rappera" (povinné, název souboru bez .mdx, malá písmena a pomlčky)
realName: "Občanské jméno" (volitelné)
born: "1995" (volitelné)
active: "2015–současnost" (volitelné)
label: "Název labelu" (volitelné)
genre: ["drill", "trap"] (volitelné, pole slugů žánrů)
description: "Stručný popis rappera, max 200 znaků. Tohle jde do meta description a schema.org." (povinné, min 10 znaků)
image: "/images/raperi/jmeno.jpg" (volitelné)
featured: true (volitelné)
publishedAt: "${new Date().toISOString().split('T')[0]}" (povinné, formát YYYY-MM-DD, V UVOZOVKÁCH)
updatedAt: "2024-06-01" (volitelné)
relatedRappers: ["slug-1", "slug-2"] (volitelné, slugy)
relatedAlbums: ["slug-alba"] (volitelné)

# ŠABLONA PRO TYP: alba
title: "Název Alba" (povinné)
slug: "nazev-alba" (povinné)
rapper: "Jméno Rappera" (povinné, display name)
rapperSlug: "jmeno-rappera" (povinné, slug rappera pro linking)
label: "Název labelu" (volitelné)
labelSlug: "slug-labelu" (volitelné)
year: 2024 (povinné, NUMBER - BEZ UVOZOVEK!)
genre: ["drill", "trap"] (volitelné)
description: "Stručný popis alba." (povinné)
image: "/images/alba/cover.jpg" (volitelné)
tracklist: (volitelné, odřádkované pole např: \n  - "Track 1"\n  - "Track 2")
rating: 8.5 (volitelné, NUMBER)
publishedAt: "${new Date().toISOString().split('T')[0]}" (povinné)

# ŠABLONA PRO TYP: labely
title: "Název Labelu" (povinné)
slug: "nazev-labelu" (povinné)
founded: "2014" (volitelné)
location: "Praha" (volitelné)
description: "Popis labelu." (povinné)
image: "/images/labely/logo.jpg" (volitelné)
artists: ["slug-rappera", "dalsi"] (volitelné, slugy)
publishedAt: "${new Date().toISOString().split('T')[0]}" (povinné)

# ŠABLONA PRO TYP: zanry
title: "Název Žánru" (povinné)
slug: "nazev-zanru" (povinné)
origin: "Chicago, USA (2010s)" (volitelné)
description: "Popis žánru." (povinné)
image: "/images/zanry/zanr.jpg" (volitelné)
publishedAt: "${new Date().toISOString().split('T')[0]}" (povinné)

# ŠABLONA PRO TYP: clanky
title: "Název článku" (povinné)
slug: "nazev-clanku" (povinné)
category: "Analýza" (povinné - Analýza/Recenze/Novinky/Profil)
description: "Popis článku." (povinné)
image: "/images/clanky/cover.jpg" (volitelné)
author: "redakce" (volitelné)
featured: true (volitelné)
publishedAt: "${new Date().toISOString().split('T')[0]}" (povinné)
tags: ["milion-plus", "drill"] (volitelné)

# ŠABLONA PRO TYP: skladby
title: "Název skladby" (povinné)
slug: "nazev-skladby-rapper" (povinné - musí být globálně unikátní, konvence: nazev-tracku-rapper)
rapper: "Jméno rappera" (povinné)
rapperSlug: "jmeno-rappera" (povinné)
features: ["slug1"] (volitelné, slugy featů)
featuresNames: ["Jméno1"] (volitelné)
album: "Název alba" (volitelné)
albumSlug: "nazev-alba" (volitelné)
year: 2019 (volitelné, NUMBER BEZ UVOZOVEK)
genre: ["drill", "trap"] (volitelné)
duration: "3:42" (volitelné)
trackNumber: 2 (volitelné)
producers: ["slug1"] (volitelné)
producersNames: ["Jméno"] (volitelné)
description: "Stručný popis." (povinné)
image: "/images/skladby/cover.jpg" (volitelné)
publishedAt: "${new Date().toISOString().split('T')[0]}" (povinné)

Využívej data specifická pro daný typ z instrukcí výše, ale vracej to pouze pokud uživatelův typ odpovídá (\`${type}\`).`;

    if (provider === 'ollama') {
      const selectedModel = model || 'llama3';
      // MOCK OLLAMA GENERATION: Since we don't have a real Ollama endpoint, simulate a response
      const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const mockResult = `---
title: "${query}"
slug: "${slug}"
description: "Vygenerováno pomocí lokálního modelu ${selectedModel}."
publishedAt: "${new Date().toISOString().split('T')[0]}"
---

Toto je ukázkový text vygenerovaný (simulovaným) modelem **${selectedModel}** pro entitu typu ${type}.
V produkci by zde bylo volání na Ollama API, např. \`http://localhost:11434/api/generate\`.`;
      return res.json({ mdx: mockResult });
    }

    // Default to Gemini
    const ai = getAI();
    let options: any = {
      model: "gemini-3.5-flash",
      contents: `Vygeneruj profil pro: ${query} (typ: ${type})`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    };
    
    // If they supplied an API key in UI, you'd technically initialize a new GoogleGenAI instance.
    // For this example, we just use the default configured one or pass it as an option if supported.
    let currentAi = ai;
    if (apiKey && apiKey !== process.env.GEMINI_API_KEY) {
       currentAi = new GoogleGenAI({
         apiKey,
         httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
       });
    }

    const response = await currentAi.models.generateContent(options);
    const mdx = response.text;
    res.json({ mdx });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

// API: Get available models (Ollama fetching or simulation fallback)
app.get("/api/tags", async (req, res) => {
  try {
    const response = await fetch("https://ollama.com/api/tags", {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
       throw new Error(`ollama.com returned status code ${response.status}`);
    }
    const data = await response.json() as any;
    if (data && Array.isArray(data.models)) {
      const models = data.models.map((m: any) => m.name || m);
      return res.json({ models });
    } else if (data && typeof data === 'object') {
      const models = Object.keys(data);
      return res.json({ models });
    }
    throw new Error("Invalid format returned from ollama.com tags API");
  } catch (err) {
    console.warn("Could not fetch models dynamically from https://ollama.com/api/tags, using predefined list of popular models:", err);
    res.json({ 
      models: [
        "llama3", 
        "llama3:8b", 
        "llama3.1", 
        "llama3.1:8b", 
        "gemma2", 
        "gemma2:9b", 
        "gemma2:27b", 
        "gemma2:2b", 
        "mistral", 
        "phi3", 
        "phi3:medium", 
        "codegemma", 
        "codellama", 
        "qwen2", 
        "qwen2:7b", 
        "deepseek-coder", 
        "starlifter"
      ] 
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
