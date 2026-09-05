import { CounselingSession, CounselingStats, ChatMessage, CounselorPersona } from "../types";

export async function fetchSessions(params?: {
  search?: string;
  persona?: string;
  favoriteOnly?: boolean;
}): Promise<CounselingSession[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.persona && params.persona !== "all") query.set("persona", params.persona);
  if (params?.favoriteOnly) query.set("favoriteOnly", "true");

  const res = await fetch(`/api/counseling/sessions?${query.toString()}`);
  if (!res.ok) {
    throw new Error("상담 기록을 불러오는데 실패했습니다.");
  }
  const data = await res.json();
  return data.sessions || [];
}

export async function fetchSessionById(id: string): Promise<CounselingSession> {
  const res = await fetch(`/api/counseling/sessions/${id}`);
  if (!res.ok) {
    throw new Error("상담 기록 상세를 불러올 수 없습니다.");
  }
  return res.json();
}

export async function saveSessionToServer(sessionData: {
  title: string;
  summary?: string;
  persona: CounselorPersona;
  messages: ChatMessage[];
  tags?: string[];
  moodScore?: number;
  notes?: string;
  isFavorite?: boolean;
}): Promise<CounselingSession> {
  const res = await fetch("/api/counseling/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData),
  });
  if (!res.ok) {
    throw new Error("상담 기록 저장에 실패했습니다.");
  }
  return res.json();
}

export async function updateSessionOnServer(
  id: string,
  updates: Partial<CounselingSession>
): Promise<CounselingSession> {
  const res = await fetch(`/api/counseling/sessions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error("상담 기록 수정에 실패했습니다.");
  }
  return res.json();
}

export async function deleteSessionFromServer(id: string): Promise<void> {
  const res = await fetch(`/api/counseling/sessions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("상담 기록 삭제에 실패했습니다.");
  }
}

export async function autoSummarizeSession(
  messages: ChatMessage[],
  persona: CounselorPersona
): Promise<{ title: string; summary: string; tags: string[] }> {
  const res = await fetch("/api/counseling/sessions/auto-summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  });
  if (!res.ok) {
    throw new Error("자동 요약 생성에 실패했습니다.");
  }
  return res.json();
}

export async function fetchCounselingStats(): Promise<CounselingStats> {
  const res = await fetch("/api/counseling/stats");
  if (!res.ok) {
    throw new Error("상담 통계를 불러올 수 없습니다.");
  }
  return res.json();
}
