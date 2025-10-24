import PptxGenJS from "pptxgenjs";

function addSlide(pres, title, bullets, notes) {
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText(title, {
    x: 0.5, y: 0.4, w: 9.0, h: 0.6,
    bold: true,
    fontFace: "Helvetica",
    fontSize: 28,
    color: "111111",
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.5, y: 1.1, w: 9.0, h: 0.03,
    fill: { color: "111111" },
  });

  const bulletText = bullets.map((b) => (typeof b === "string" ? { text: b } : b));
  slide.addText(bulletText, {
    x: 0.7, y: 1.4, w: 8.6, h: 4.5,
    fontFace: "Helvetica",
    fontSize: 18,
    color: "222222",
    bullet: true,
    lineSpacing: 24,
  });

  if (notes) slide.addNotes(notes);
}

function generatePitch() {
  const pres = new PptxGenJS();
  pres.title = "Soma 5-Page Pitch";

  addSlide(
    pres,
    "Soma: From Memories to Interactive Digital Personas",
    [
      "Problem: Fragmented memories fail to sustain meaningful connection; traditional memorials are static and passive.",
      "Solution: Soma transforms multi-modal life data (text, audio, video, social traces) into a governed, safe, and warm digital persona.",
      "Positioning: The AI platform for family memories and digital continuity.",
      "Business elasticity: B2C family subscriptions + B2B institutional partnerships (memorial, will/estate, culture).",
    ],
    "Emphasize empathy + boundaries; the product augments remembrance without replacing real relationships."
  );

  addSlide(
    pres,
    "Product Experience: Dialogue, Collaboration, Rituals",
    [
      "Dialogue (Chat): Ask persona; Soma retrieves relevant memories and replies in the person's style with citations.",
      "Memories/Feed (Collaboration): Families co-curate photos and videos. The memory graph strengthens over time.",
      "Ritual Mode: On key dates, use softer cadence, curated memories, and user-configurable boundaries.",
      "Time-to-First-Persona (TTFP): < 5 minutes to first 'sounds-like-them' reply via guided import.",
    ],
    "Tell one cohesive story from import → first dialogue → family co-creation → ritual day trigger."
  );

  addSlide(
    pres,
    "Architecture & Defensibility",
    [
      "Ingestion & Normalize: Multi-modal inputs with ASR/OCR/metadata and sensitivity labeling.",
      "Memory Graph & Vector Retrieval: Postgres + pgvector (extensible to Pinecone/Neo4j).",
      "Persona Builder: Style/values modeling with family calibration.",
      "Runtime: RAG-first generation → guardrails → text/voice output; Observability: PCS, factuality, cost/latency.",
      "Consent & Governance: Will/executor permissions, policy engine, immutable audit log; security: encryption-at-rest & in-transit.",
      "Current codebase: React+Vite front-end (unified motion variants) and Self_AI_Agent TypeScript service skeleton.",
    ],
    "Stress RAG-first, light fine-tuning (LoRA) later; caching & distillation control COGS."
  );

  addSlide(
    pres,
    "Business Model & GTM",
    [
      "B2C: Free tier + Premium + Family plan; add-ons (memorial video, 3D rituals, compliant voice).",
      "B2B: Co-branded memorial services, estate planning partners, cultural institutions; license/revenue share.",
      "Marketplace: Plugins/templates; platform take rate.",
      "Growth: Guided import, weekly prompts, family invites; target gross margin >70% via multi-model routing & caching.",
    ],
    "Show repeatable channel strategy and PoC → scale path with unit economics discipline."
  );

  addSlide(
    pres,
    "Roadmap, KPIs & Fundraising",
    [
      "Roadmap: v1 Persona-RAG + family collaboration + governance; v1.5 rituals & memorial videos; v2 multimodal long-term graph; v3 cultural memory network.",
      "North Star: Family monthly interactive minutes; Key: TTFP, weekly dialogues, ritual participation, PCS, factual citations, conversion, gross margin.",
      "Ask: Funding for model/data infra, compliance & audits, B2B channels, and key hires with 12–18 month milestones.",
      "Risks & Mitigations: Ethics, cost/latency, data security; governance and guardrails are built-in by design.",
    ],
    "Close with timeline, KPI dashboard mock, and funds allocation pie chart."
  );

  return pres.writeFile({ fileName: "docs/Soma-5p-Pitch.pptx" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generatePitch();
}
