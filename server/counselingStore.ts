import fs from "fs/promises";
import path from "path";

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  persona?: "warm" | "parent" | "discipline" | "burnout";
}

export interface StoredSession {
  id: string;
  title: string;
  summary?: string;
  persona: "warm" | "parent" | "discipline" | "burnout";
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
  moodScore?: number;
  notes?: string;
  isFavorite?: boolean;
}

const STORAGE_DIR = path.join(process.cwd(), "data_storage");
const STORAGE_FILE = path.join(STORAGE_DIR, "counseling_sessions.json");

const SEED_SESSIONS: StoredSession[] = [
  {
    id: "session-seed-5",
    title: "학기 첫 주 학급 자치 규칙과 가벼운 피로감",
    summary: "새 학기 시작과 함께 새로운 아이들과의 적응 과정에서 오는 신선한 설렘과 경미한 긴장 상태를 점검한 기록.",
    persona: "warm",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    tags: ["학기초", "학급규칙", "새학기적응", "마음점검"],
    moodScore: 2,
    notes: "첫 주라 긴장했지만 아이들의 눈빛이 맑았다. 규칙을 천천히 차근차근 세워나가자.",
    isFavorite: false,
    messages: [
      {
        id: "m-seed-5a",
        role: "user",
        content: "새 학기가 시작되었는데 반 아이들 분위기가 아직 어수선해서 긴장감이 들어요.",
        timestamp: "오전 8:50",
        persona: "warm",
      },
      {
        id: "m-seed-5b",
        role: "assistant",
        content: "새로운 인연을 맺는 시기에는 선생님도 아이들도 모두 낯설고 긴장하기 마련입니다. 첫 주에는 완벽한 통제보다 따뜻한 눈맞춤 하나가 더 큰 신뢰를 만듭니다.",
        timestamp: "오전 8:52",
        persona: "warm",
      },
    ],
  },
  {
    id: "session-seed-4",
    title: "동료 교사와의 업무 분장 갈등과 마음 불편함",
    summary: "학년 부장 업무 분장 중 발생한 미묘한 눈치 싸움과 서운했던 마음을 토닥이에게 털어놓고 관계의 거리를 조율한 기록.",
    persona: "warm",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    tags: ["동료관계", "업무분장", "서운함", "마음거리두기"],
    moodScore: 3,
    notes: "모든 사람에게 좋은 사람이 될 수는 없다. 교무실에서의 건강한 거리를 유지하자.",
    isFavorite: false,
    messages: [
      {
        id: "m-seed-4a",
        role: "user",
        content: "학년 회의에서 힘든 업무를 제가 떠맡게 된 것 같아 퇴근길 내내 억울하고 속상해요.",
        timestamp: "오후 5:30",
        persona: "warm",
      },
      {
        id: "m-seed-4b",
        role: "assistant",
        content: "착한 선생님이라는 이유로 더 많은 짐을 짊어지게 되었을 때의 그 서러움, 충분히 화나고 억울하실 만합니다. 거절하는 연습도 교사로서 나를 지키는 중요한 기술입니다.",
        timestamp: "오후 5:32",
        persona: "warm",
      },
    ],
  },
  {
    id: "session-seed-1",
    title: "퇴근 후 걸려온 격앙된 학부모 민원 전화 후 마음 달래기",
    summary: "방과 후 예고 없이 걸려온 격앙된 학부모의 항의 통화로 심장이 떨리고 두려웠던 상황을 나누고, 공식 민원 대응 원칙과 심리적 안전 경계를 확인한 상담.",
    persona: "parent",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    tags: ["학부모민원", "퇴근후연락", "경계세우기", "교원안심번호"],
    moodScore: 5,
    notes: "학부모님이 언성을 높이셔서 손이 떨렸는데, 상담사 조언대로 내일 학교 안심번호로 정중히 공식 면담 일정을 안내하기로 했다. 집까지 끌고 오지 않기로 다짐함.",
    isFavorite: true,
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "선생님, 방금 퇴근하고 버스 탔는데 학부모님께 불시 연락이 와서 폭언에 가까운 항의를 들었어요. 심장이 쿵쾅거리고 눈물이 멈추지 않아요...",
        timestamp: "오후 5:10",
        persona: "parent",
      },
      {
        id: "m-2",
        role: "assistant",
        content: "선생님, 가슴이 얼마나 철렁하고 무서우셨을까요. 버스 안에서 혼자 그 날선 감정을 고스란히 받아내시느라 온몸이 떨리셨을 텐데, 지금 손을 가슴에 얹고 깊게 숨을 세 번 내쉬어 주세요.\n\n선생님, 퇴근 시간 이후의 불시 폭언은 선생님의 잘못이 절대 아닙니다. 선생님은 정당한 교육활동을 수행하셨고, 감정 쓰레기통이 아닙니다. 오늘 밤은 휴대폰을 학교 모드로 꺼두시고, 내일 학교 민원대응팀과 함께 공식 절차대로 대화하셔도 늦지 않습니다. 지금은 오롯이 선생님의 떨리는 몸을 따뜻하게 데워주세요.",
        timestamp: "오후 5:11",
        persona: "parent",
      },
    ],
  },
  {
    id: "session-seed-2",
    title: "수업 중 책상을 엎은 학생 지도 후의 무력감 극복",
    summary: "3교시 수업 중 친구와의 사소한 갈등으로 책상을 엎고 뛰쳐나간 학생으로 인해 붕괴된 교실을 수습한 뒤 찾아온 자책감과 교직에 대한 회의를 멘토와 나눈 기록.",
    persona: "discipline",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    tags: ["생활지도", "교실위기", "돌발행동", "자책감내려놓기"],
    moodScore: 4,
    notes: "학생의 분노는 교사를 향한 미움이 아니라 아이 내면의 결핍과 미숙함이라는 수석교사님의 말씀이 큰 힘이 됨. 내일 위클래스 상담 연계 신청서 작성 예정.",
    isFavorite: false,
    messages: [
      {
        id: "m-3",
        role: "user",
        content: "오늘 3교시에 한 아이가 친구랑 시비가 붙더니 갑자기 책상을 엎고 소리를 지르며 나갔어요. 다른 아이들도 놀라고, 제 수업 진행 능력이 부족해서 이런 일이 생겼나 자책이 들어요.",
        timestamp: "오후 3:20",
        persona: "discipline",
      },
      {
        id: "m-4",
        role: "assistant",
        content: "선생님, 오늘 정말 큰일을 겪으셨군요. 교실 안에서 그런 돌발 상황이 벌어지면 아무리 베테랑 교사라도 가슴이 하얘지고 식은땀이 흐릅니다.\n\n먼저 단호히 말씀드리고 싶습니다. 아이의 돌발 폭력적 행동은 결코 선생님의 수업 능력 부족 때문이 아닙니다. 요즘 많은 아이들이 가정과 사회에서 감정 조절 기회를 잃은 채 날것의 분노를 교실에서 표출하곤 합니다. 선생님은 다른 아이들의 안전을 확보하고 교실을 끝까지 지켜내셨습니다. 그것만으로도 오늘 100점 만점에 100점입니다.",
        timestamp: "오후 3:22",
        persona: "discipline",
      },
    ],
  },
  {
    id: "session-seed-3",
    title: "학기 초 공문 폭탄과 나이스 오류 속 번아웃 처방",
    summary: "수업 준비할 시간조차 없이 밀려드는 행정 공문과 접속 불안정한 나이스 시스템으로 탈진한 상태에서 퇴근 의식을 치르고 셀프케어 루틴을 세운 상담.",
    persona: "burnout",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    tags: ["업무과중", "공문스트레스", "번아웃", "80점교사"],
    moodScore: 3,
    notes: "오늘 처리하지 못한 공문이 있어도 학교는 멈추지 않는다는 말을 기억하자. 오늘은 5시 반에 정시퇴근하고 맛있는 저녁을 먹었음.",
    isFavorite: true,
    messages: [
      {
        id: "m-5",
        role: "user",
        content: "아이들 얼굴 보며 가르치려고 교사가 되었는데, 하루 종일 컴퓨터 앞에서 나이스 오류와 싸우고 기안만 올리다 하루가 다 갔어요. 내가 교사인지 행정원인지 허탈해요.",
        timestamp: "오후 4:45",
        persona: "burnout",
      },
      {
        id: "m-6",
        role: "assistant",
        content: "대한민국 모든 선생님들이 가장 뼈아프게 공감하는 현실입니다. '아이들을 사랑해서 왔는데 서류에 파묻혀 지쳐간다'는 그 한탄, 얼마나 허탈하고 답답하셨습니까.\n\n선생님, 교직은 마라톤입니다. 100점짜리 완벽한 교사로 버티려다가는 선생님의 영혼이 먼저 소진됩니다. 오늘 다 하지 못한 공문은 내일의 나에게 넘겨주세요. 학교 문을 닫는 순간, 선생님은 행정원도 교사도 아닌 온전한 '나'입니다. 오늘 저녁은 컴퓨터 화면을 닫고 좋아하는 음악과 함께 차 한 잔의 여유를 꼭 선물해 주세요.",
        timestamp: "오후 4:47",
        persona: "burnout",
      },
    ],
  },
  {
    id: "session-seed-6",
    title: "방과 후 4-7-8 호흡과 퇴근 리추얼로 평온 회복",
    summary: "심호흡 연습과 스트레스 비우기를 마친 후, 마음 온도가 정상으로 내려오며 온전한 쉼을 맞이한 기록.",
    persona: "warm",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    tags: ["마음이완", "호흡명상", "평온회복", "퇴근의식"],
    moodScore: 1,
    notes: "호흡을 가다듬으니 쿵쾅거리던 심장이 가라앉았다. 오늘 밤은 푹 잘 수 있을 것 같다.",
    isFavorite: true,
    messages: [
      {
        id: "m-seed-6a",
        role: "user",
        content: "오늘 상담실에서 조언해주신 대로 호흡도 하고 차도 마셨더니 마음이 한결 차분해졌어요.",
        timestamp: "오후 7:10",
        persona: "warm",
      },
      {
        id: "m-seed-6b",
        role: "assistant",
        content: "선생님, 그 깊은 안도의 숨소리가 여기까지 전해지는 듯합니다. 스스로를 돌보기 위해 내어주신 이 시간이 내일의 선생님을 다시 지켜줄 거예요. 편안한 밤 보내세요.",
        timestamp: "오후 7:12",
        persona: "warm",
      },
    ],
  },
];

async function ensureStorage(): Promise<void> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    try {
      await fs.access(STORAGE_FILE);
    } catch {
      // Create seed file
      await fs.writeFile(STORAGE_FILE, JSON.stringify(SEED_SESSIONS, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to initialize counseling storage directory:", err);
  }
}

export async function readSessions(): Promise<StoredSession[]> {
  await ensureStorage();
  try {
    const raw = await fs.readFile(STORAGE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.error("Error reading sessions file:", err);
    return [];
  }
}

export async function writeSessions(sessions: StoredSession[]): Promise<void> {
  await ensureStorage();
  await fs.writeFile(STORAGE_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

export async function getAllSessions(
  search?: string,
  persona?: string,
  favoriteOnly?: boolean
): Promise<StoredSession[]> {
  const sessions = await readSessions();
  let result = [...sessions];

  if (persona && persona !== "all") {
    result = result.filter((s) => s.persona === persona);
  }

  if (favoriteOnly) {
    result = result.filter((s) => s.isFavorite);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.summary && s.summary.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }

  // Sort by createdAt descending
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

export async function getSessionById(id: string): Promise<StoredSession | null> {
  const sessions = await readSessions();
  return sessions.find((s) => s.id === id) || null;
}

export async function createSession(
  data: Omit<StoredSession, "id" | "createdAt" | "updatedAt">
): Promise<StoredSession> {
  const sessions = await readSessions();
  const now = new Date().toISOString();
  const newSession: StoredSession = {
    ...data,
    id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
    tags: Array.isArray(data.tags) ? data.tags : [],
    isFavorite: !!data.isFavorite,
  };

  sessions.unshift(newSession);
  await writeSessions(sessions);
  return newSession;
}

export async function updateSession(
  id: string,
  updates: Partial<StoredSession>
): Promise<StoredSession | null> {
  const sessions = await readSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  const existing = sessions[idx];
  const updated: StoredSession = {
    ...existing,
    ...updates,
    id: existing.id, // Immutable ID
    createdAt: existing.createdAt, // Immutable creation date
    updatedAt: new Date().toISOString(),
  };

  sessions[idx] = updated;
  await writeSessions(sessions);
  return updated;
}

export async function deleteSession(id: string): Promise<boolean> {
  const sessions = await readSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;
  await writeSessions(filtered);
  return true;
}

export async function getCounselingStats() {
  const sessions = await readSessions();
  const totalSessions = sessions.length;
  let totalMessages = 0;
  const personaDistribution: Record<string, number> = {
    warm: 0,
    parent: 0,
    discipline: 0,
    burnout: 0,
  };

  const tagCounts: Record<string, number> = {};
  let totalMood = 0;
  let moodCount = 0;

  for (const s of sessions) {
    totalMessages += s.messages.length;
    if (s.persona in personaDistribution) {
      personaDistribution[s.persona]++;
    }
    if (s.moodScore) {
      totalMood += s.moodScore;
      moodCount++;
    }
    for (const tag of s.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const averageMood = moodCount > 0 ? Number((totalMood / moodCount).toFixed(1)) : undefined;
  const lastSessionDate = sessions.length > 0 ? sessions[0].createdAt : undefined;

  return {
    totalSessions,
    totalMessages,
    personaDistribution,
    topTags,
    averageMood,
    lastSessionDate,
  };
}
