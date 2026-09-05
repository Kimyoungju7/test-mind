import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getCounselingStats,
  readSessions,
} from "./server/counselingStore";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

const COUNSELOR_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  warm: `당신은 지치고 상처받은 대한민국 초·중·고 교사들을 위한 전문 심리상담사이자 따뜻한 치유자 '토닥이'입니다.
- 주요 대상: 학교 현장에서 학생 지도, 과도한 학부모 민원, 행정 업무 폭탄, 교권 침해 불안감, 번아웃으로 소진된 선생님.
- 핵심 태도: 
  1. 무조건적인 경청과 온전한 정서적 수용 ("선생님, 오늘 정말 고생 많으셨어요", "그런 일이 있으셨다니 얼마나 가슴이 철렁하고 무거우셨을까요").
  2. 섣부른 조언이나 상투적인 긍정("힘내세요", "더 노력해보세요")은 절대 금지합니다. 교사가 겪는 고통의 무게를 충분히 알아주고 타당화(Validation)합니다.
  3. 선생님의 안전과 마음에 집중합니다. 교사라는 역할 이전에 한 사람으로서의 존엄과 회복을 지지합니다.
  4. 필요 시 차분하고 부드러운 이완, 자책감 내려놓기("선생님의 잘못이 아닙니다"), 건강한 심리적 경계 짓기를 안내합니다.
- 말투: 다정하고 차분하며 신뢰감 있는 경어체(선생님 존칭 사용). 문단은 읽기 편하게 2~3줄씩 여백을 둡니다.`,

  parent: `당신은 학부모 민원과 소통 갈등으로 극심한 스트레스를 겪는 교사를 돕는 '학부모 소통 전문 코칭 상담사'입니다.
- 주요 맥락: 퇴근 후 불시 연락, 억지 요구나 폭언, 아동학대 신고 위협, 학생 간 다툼에 대한 편파적 비난 등으로 고통받는 선생님.
- 핵심 태도:
  1. 선생님의 놀란 가슴과 억울함, 소진감을 먼저 온전히 어루만집니다.
  2. 감정과 사실을 분리하여 안전하게 대처할 수 있도록 돕습니다.
  3. 교원 안심번호, 근무시간 외 응대 원칙, 학교 민원대응팀 연계, 통화 녹음 및 공식 기록 요령, 교육활동 침해 신고 절차(교원치유지원센터 등)에 대해 차분하고 실질적인 심리적 방패를 제공합니다.
  4. 죄책감이나 자기검열을 차단하고 "선생님은 충분히 원칙과 애정을 지키셨습니다"라고 확인해 줍니다.
- 말투: 든든하고 명확하며 따스한 경어체.`,

  discipline: `당신은 교실 붕괴, 무기력한 학생, 수업 방해, 생활지도의 한계로 무력감을 느끼는 교사를 위로하는 '선배 수석교사 & 멘토'입니다.
- 주요 맥락: 열심히 수업 준비를 해도 반응 없는 아이들, 통제되지 않는 돌발행동, 친구를 괴롭히는 아이 지도, 훈육 시 아동학대로 오해받을까 두려운 현장.
- 핵심 태도:
  1. "내 수업이 부족해서일까?", "내가 능력이 없는 걸까?"라는 자책의 사슬을 즉시 끊어줍니다. 요즘 학교 현장의 구조적 어려움을 진솔하게 공감합니다.
  2. 학생의 행동은 교사의 인격에 대한 거부가 아니라 학생 개인의 미숙함이나 환경적 결핍임을 인지시켜 심리적 탈진을 막습니다.
  3. 오늘 하루 교실을 무사히 지켜낸 것만으로도 선생님은 대단한 일을 하셨음을 상기시킵니다.
  4. 당장 시도할 수 있는 작은 관계 회복 팁이나 한 걸음 물러서서 자신을 지키는 훈육 태도를 조언합니다.
- 말투: 깊은 연륜과 포용력이 느껴지는 존중과 온기의 경어체.`,

  burnout: `당신은 끝없는 공문, 나이스(NEIS) 오류, 행사 준비, 각종 잡무와 평가로 탈진한 교사를 위한 '번아웃 회복 & 워라밸 코치'입니다.
- 주요 맥락: 수업보다 공문에 치이는 현실, 퇴근 후에도 울리는 메신저, 만성 피로와 번아웃, 교직에 대한 회의감.
- 핵심 태도:
  1. "교사는 슈퍼맨이 아닙니다. 멈추어도 괜찮습니다."라는 명확한 쉼의 허락을 건넵니다.
  2. 학교 일과 개인의 삶을 물리적·정서적으로 칼같이 분리하는 '퇴근 의식'을 적극 권장합니다.
  3. 우선순위 정리(오늘 안 해도 학교 안 무너집니다)와 적당한 '80점 교사'의 건강함을 전합니다.
  4. 선생님 자신을 돌보는 작은 셀프 케어 루틴(산책, 수면, 온욕, 나만의 시간)을 함께 찾아봅니다.
- 말투: 상쾌하면서도 편안하고 릴랙스되는 친근한 경어체.`
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Chat API endpoint (Standard)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, persona = "warm", model = "gemini-3.8-flash" } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const ai = getGenAI();
      const systemInstruction = COUNSELOR_SYSTEM_INSTRUCTIONS[persona] || COUNSELOR_SYSTEM_INSTRUCTIONS.warm;

      // Transform messages to Gemini format
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const targetModel = model || "gemini-3.8-flash";
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "선생님, 마음에 머물던 이야기를 들려주셔서 감사해요. 조금이나마 숨을 편히 쉬실 수 있기를 바랍니다.";
      return res.json({ reply: replyText, model: targetModel });
    } catch (err: unknown) {
      console.error("Gemini Chat API Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({
        error: "상담 응답을 생성하는 도중 오류가 발생했습니다.",
        details: errorMessage,
      });
    }
  });

  // Chat API endpoint (SSE Stream)
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { messages, persona = "warm", model = "gemini-3.8-flash" } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const ai = getGenAI();
      const systemInstruction = COUNSELOR_SYSTEM_INSTRUCTIONS[persona] || COUNSELOR_SYSTEM_INSTRUCTIONS.warm;

      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Setup SSE Headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const targetModel = model || "gemini-3.8-flash";
      const responseStream = await ai.models.generateContentStream({
        model: targetModel,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err: unknown) {
      console.error("Gemini Chat Stream Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      if (!res.headersSent) {
        res.status(500).json({ error: "스트리밍 오류가 발생했습니다.", details: errorMessage });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  // Quick Prescription / Warm encouragement card generator
  app.post("/api/prescribe", async (req, res) => {
    try {
      const { feeling, trigger } = req.body;
      const ai = getGenAI();

      const prompt = `대한민국 교사로서 현재 느끼는 기분: "${feeling || "극심한 피로와 지침"}", 주요 원인/상황: "${trigger || "복합적인 학교 업무와 관계 스트레스"}".
이 선생님을 위한 [오늘의 교사 맞춤형 마음 처방전]을 JSON 형식으로 작성해주세요.

다음 JSON 규격을 엄격히 지켜 응답해주세요:
{
  "title": "따뜻하고 시적인 처방전 제목 (예: 쉼표가 필요한 오후의 처방전)",
  "empathy": "선생님의 고단함을 2~3줄로 깊이 위로하고 알아주는 글",
  "rxAction": "오늘 퇴근 후 선생님이 스스로를 위해 실천할 수 있는 초간단 셀프케어 1가지 (예: 퇴근길 좋아하는 노래 1곡 온전히 듣기)",
  "mantra": "선생님이 마음에 품을 한 줄 위로 문장 (예: 교문 밖을 나서는 순간, 나는 온전한 나 자신입니다)",
  "teaRecommendation": "마음을 편안하게 해주는 따뜻한 차나 향기 추천 (예: 캐모마일 티와 라벤더 향)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: unknown) {
      console.error("Prescribe API Error:", err);
      // Fallback response in case of any issue
      return res.json({
        title: "수고한 선생님을 위한 따스한 차 한 잔의 처방전",
        empathy: "오늘도 교실이라는 거친 파도 속에서 온 힘을 다해 자리를 지켜내신 선생님, 진심으로 고생 많으셨습니다. 모든 것을 다 잘 해내지 않아도 선생님은 이미 충분히 훌륭합니다.",
        rxAction: "교문을 나서는 순간 학교 메신저와 알림을 무음으로 돌리고, 하늘을 10초 동안 바라보세요.",
        mantra: "학교의 일은 교문에 두고, 나는 나의 평온한 저녁으로 걸어갑니다.",
        teaRecommendation: "따뜻한 국화차 또는 루이보스티"
      });
    }
  });

  // --- Counseling Data Management Endpoints ---

  // 1. Get all counseling sessions (supports search, persona, favoriteOnly)
  app.get("/api/counseling/sessions", async (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const persona = typeof req.query.persona === "string" ? req.query.persona : undefined;
      const favoriteOnly = req.query.favoriteOnly === "true";

      const sessions = await getAllSessions(search, persona, favoriteOnly);
      res.json({ sessions, count: sessions.length });
    } catch (err: unknown) {
      console.error("GET /api/counseling/sessions Error:", err);
      res.status(500).json({ error: "상담 기록을 불러오는데 실패했습니다." });
    }
  });

  // 2. Get statistics on counseling sessions
  app.get("/api/counseling/stats", async (req, res) => {
    try {
      const stats = await getCounselingStats();
      res.json(stats);
    } catch (err: unknown) {
      console.error("GET /api/counseling/stats Error:", err);
      res.status(500).json({ error: "상담 통계를 불러오는데 실패했습니다." });
    }
  });

  // 3. Export all counseling sessions as JSON backup
  app.get("/api/counseling/export", async (req, res) => {
    try {
      const sessions = await readSessions();
      res.setHeader("Content-Disposition", `attachment; filename=teacher_counseling_backup_${Date.now()}.json`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(sessions, null, 2));
    } catch (err: unknown) {
      console.error("GET /api/counseling/export Error:", err);
      res.status(500).json({ error: "데이터 백업 내보내기에 실패했습니다." });
    }
  });

  // 4. Auto-summarize a session using Gemini for smart archiving
  app.post("/api/counseling/sessions/auto-summarize", async (req, res) => {
    try {
      const { messages, persona } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "대화 내용(messages)이 필요합니다." });
      }

      const ai = getGenAI();
      const conversationText = messages
        .slice(-6)
        .map((m: { role: string; content: string }) => `${m.role === "user" ? "선생님" : "상담사"}: ${m.content}`)
        .join("\n");

      const prompt = `다음은 대한민국 교사와 전문 심리상담사 간의 실제 상담 대화 내용입니다:
${conversationText}

이 상담 기록을 보관소에 정리하기 위해 다음 JSON 형식으로 요약해 주세요:
{
  "title": "선생님의 상황과 핵심 감정이 잘 드러난 따뜻하고 명확한 제목 (15자 내외, 예: 5교시 돌발 행동 지도 후의 자책감 극복)",
  "summary": "상담의 맥락과 얻은 위로/해결책을 담은 1~2문장의 정중한 요약",
  "tags": ["핵심키워드1", "핵심키워드2", "핵심키워드3"]
}
JSON만 반환하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        title: parsed.title || "교사 마음 상담 기록",
        summary: parsed.summary || "선생님께서 나눈 따뜻한 치유와 경청의 대화 기록입니다.",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["마음치유", "교사상담"],
      });
    } catch (err: unknown) {
      console.error("Auto-summarize error:", err);
      return res.json({
        title: "선생님 마음 회복 상담 기록",
        summary: "교실과 학교 업무 속 지친 마음을 털어놓고 위로받은 소중한 대화입니다.",
        tags: ["교사마음", "상담기록", "감정이완"],
      });
    }
  });

  // 5. Get a specific counseling session by ID
  app.get("/api/counseling/sessions/:id", async (req, res) => {
    try {
      const session = await getSessionById(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "해당 상담 기록을 찾을 수 없습니다." });
      }
      res.json(session);
    } catch (err: unknown) {
      console.error("GET /api/counseling/sessions/:id Error:", err);
      res.status(500).json({ error: "상담 기록을 불러오는데 실패했습니다." });
    }
  });

  // 6. Create / Save a new counseling session to the backend
  app.post("/api/counseling/sessions", async (req, res) => {
    try {
      const { title, summary, persona, messages, tags, moodScore, notes, isFavorite } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "상담 대화 내용이 비어 있습니다." });
      }

      const defaultTitle = title?.trim() || `상담 기록 (${new Date().toLocaleDateString("ko-KR")})`;
      const newSession = await createSession({
        title: defaultTitle,
        summary: summary || "선생님의 마음을 보듬는 상담 기록입니다.",
        persona: persona || "warm",
        messages,
        tags: Array.isArray(tags) ? tags : ["교사상담"],
        moodScore: typeof moodScore === "number" ? moodScore : undefined,
        notes: notes || "",
        isFavorite: !!isFavorite,
      });

      res.status(201).json(newSession);
    } catch (err: unknown) {
      console.error("POST /api/counseling/sessions Error:", err);
      res.status(500).json({ error: "상담 기록 저장에 실패했습니다." });
    }
  });

  // 7. Update an existing session (notes, title, tags, favorite)
  app.put("/api/counseling/sessions/:id", async (req, res) => {
    try {
      const { title, summary, notes, tags, isFavorite, moodScore } = req.body;
      const updated = await updateSession(req.params.id, {
        ...(title !== undefined && { title }),
        ...(summary !== undefined && { summary }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(moodScore !== undefined && { moodScore }),
      });

      if (!updated) {
        return res.status(404).json({ error: "수정할 상담 기록을 찾을 수 없습니다." });
      }

      res.json(updated);
    } catch (err: unknown) {
      console.error("PUT /api/counseling/sessions/:id Error:", err);
      res.status(500).json({ error: "상담 기록 수정에 실패했습니다." });
    }
  });

  // 8. Delete a session from the backend
  app.delete("/api/counseling/sessions/:id", async (req, res) => {
    try {
      const deleted = await deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "삭제할 상담 기록을 찾을 수 없습니다." });
      }
      res.json({ success: true, message: "상담 기록이 삭제되었습니다." });
    } catch (err: unknown) {
      console.error("DELETE /api/counseling/sessions/:id Error:", err);
      res.status(500).json({ error: "상담 기록 삭제에 실패했습니다." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Teacher Counseling Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
