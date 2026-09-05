import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  BookOpen,
  Calendar,
  Tag,
  Star,
  Trash2,
  Edit3,
  ArrowRight,
  Download,
  BarChart3,
  Check,
  RefreshCw,
  Heart,
  ShieldAlert,
  BookOpenCheck,
  Coffee,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  LineChart as LineChartIcon,
} from "lucide-react";
import { CounselingSession, CounselingStats, CounselorPersona, ChatMessage } from "../types";
import {
  fetchSessions,
  deleteSessionFromServer,
  updateSessionOnServer,
  fetchCounselingStats,
} from "../utils/counselingApi";
import { soundFx } from "../utils/audio";
import { EmotionalTrendsChart } from "./EmotionalTrendsChart";

interface CounselingArchiveModalProps {
  onClose: () => void;
  onRestoreSession: (session: CounselingSession) => void;
}

export const CounselingArchiveModal: React.FC<CounselingArchiveModalProps> = ({
  onClose,
  onRestoreSession,
}) => {
  const [activeTab, setActiveTab] = useState<"records" | "trends" | "stats">("records");
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [allSessions, setAllSessions] = useState<CounselingSession[]>([]);
  const [stats, setStats] = useState<CounselingStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<string>("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Note editing state
  const [editingNoteSessionId, setEditingNoteSessionId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sessionList, statsData, fullList] = await Promise.all([
        fetchSessions({
          search: searchQuery,
          persona: selectedPersona,
          favoriteOnly,
        }),
        fetchCounselingStats(),
        fetchSessions(), // Full list for Recharts trend analysis
      ]);
      setSessions(sessionList);
      setStats(statsData);
      setAllSessions(fullList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPersona, favoriteOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleFavorite = async (session: CounselingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playSoftChime();
    const nextVal = !session.isFavorite;

    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, isFavorite: nextVal } : s))
    );

    try {
      await updateSessionOnServer(session.id, { isFavorite: nextVal });
    } catch {
      // Revert on error
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, isFavorite: session.isFavorite } : s))
      );
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("정말로 이 상담 기록을 서버에서 삭제하시겠습니까?")) return;

    soundFx.playSoftChime();
    try {
      await deleteSessionFromServer(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (expandedSessionId === sessionId) setExpandedSessionId(null);
      // Refresh stats
      fetchCounselingStats().then(setStats);
    } catch {
      alert("상담 기록 삭제에 실패했습니다.");
    }
  };

  const handleStartEditNote = (session: CounselingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteSessionId(session.id);
    setNoteDraft(session.notes || "");
  };

  const handleSaveNote = async (sessionId: string) => {
    soundFx.playSoftChime();
    try {
      await updateSessionOnServer(sessionId, { notes: noteDraft });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, notes: noteDraft } : s))
      );
      setEditingNoteSessionId(null);
    } catch {
      alert("메모 저장에 실패했습니다.");
    }
  };

  const handleRestore = (session: CounselingSession) => {
    soundFx.playSingingBowl();
    onRestoreSession(session);
    onClose();
  };

  const handleExportBackup = () => {
    soundFx.playSoftChime();
    window.location.href = "/api/counseling/export";
  };

  const getPersonaBadge = (p: CounselorPersona) => {
    switch (p) {
      case "warm":
        return {
          label: "토닥이 (온기·경청)",
          bg: "bg-[#E9EDC9]",
          text: "text-[#556B2F]",
          border: "border-[#CCD5AE]",
          icon: <Heart className="w-3 h-3" />,
        };
      case "parent":
        return {
          label: "학부모 소통 코칭",
          bg: "bg-[#FAEDCD]",
          text: "text-[#8C5243]",
          border: "border-[#D4A373]/50",
          icon: <ShieldAlert className="w-3 h-3" />,
        };
      case "discipline":
        return {
          label: "수석교사 멘토",
          bg: "bg-[#F1EFEB]",
          text: "text-[#434B3E]",
          border: "border-[#CCD5AE]",
          icon: <BookOpenCheck className="w-3 h-3" />,
        };
      case "burnout":
        return {
          label: "번아웃·워라밸 코치",
          bg: "bg-[#FEFAE0]",
          text: "text-[#6B705C]",
          border: "border-[#CCD5AE]",
          icon: <Coffee className="w-3 h-3" />,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2D3436]/45 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[36px] max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-[#E5E2DD] flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E9EDC9] text-[#556B2F] flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-[#2D3436]">
                  교사 상담 일지 & 기록 보관소
                </h2>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE]">
                  백엔드 서버 연동됨
                </span>
              </div>
              <p className="text-xs text-[#6B705C]">
                선생님이 나눈 소중한 마음의 치유 여정과 회고 메모를 안전하게 보관합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-archive"
              onClick={onClose}
              className="p-2 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-2xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Actions */}
        <div className="px-5 sm:px-6 pt-3 pb-3 bg-[#F1EFEB]/60 border-b border-[#E5E2DD] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="tab-archive-records"
              onClick={() => {
                soundFx.playSoftChime();
                setActiveTab("records");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "records"
                  ? "bg-white text-[#556B2F] shadow-2xs border border-[#CCD5AE]"
                  : "text-[#6B705C] hover:bg-white/50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>상담 일지 목록</span>
              <span className="ml-1 text-[10px] bg-[#E9EDC9] text-[#556B2F] px-1.5 py-0.2 rounded-full">
                {sessions.length}
              </span>
            </button>

            <button
              id="tab-archive-trends"
              onClick={() => {
                soundFx.playSoftChime();
                setActiveTab("trends");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "trends"
                  ? "bg-white text-[#556B2F] shadow-2xs border border-[#CCD5AE]"
                  : "text-[#6B705C] hover:bg-white/50"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>감정 변화 추이</span>
              <span className="ml-1 text-[10px] bg-[#FEFAE0] text-[#8C5243] border border-[#CCD5AE] px-1.5 py-0.2 rounded-full font-bold">
                Recharts
              </span>
            </button>

            <button
              id="tab-archive-stats"
              onClick={() => {
                soundFx.playSoftChime();
                setActiveTab("stats");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                activeTab === "stats"
                  ? "bg-white text-[#556B2F] shadow-2xs border border-[#CCD5AE]"
                  : "text-[#6B705C] hover:bg-white/50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>마음 회복 통계 & 분석</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-export-backup"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white border border-[#E5E2DD] text-xs font-medium text-[#434B3E] hover:bg-[#F1EFEB] transition shadow-2xs"
              title="상담 데이터 JSON 백업 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>데이터 백업 다운로드</span>
            </button>
            <button
              id="btn-refresh-archive"
              onClick={loadData}
              className="p-2 rounded-2xl bg-white border border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB] transition"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === "records" ? (
            <>
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-[24px] border border-[#E5E2DD]">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search className="w-4 h-4 text-[#A9AD99] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목, 요약, 태그, 회고 메모 검색..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#FDFBF7] border border-[#E5E2DD] focus:outline-none focus:border-[#7B8E7E]"
                  />
                </form>

                {/* Persona Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: "all", label: "전체" },
                    { id: "warm", label: "토닥이" },
                    { id: "parent", label: "학부모" },
                    { id: "discipline", label: "생활지도" },
                    { id: "burnout", label: "번아웃" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedPersona(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                        selectedPersona === f.id
                          ? "bg-[#556B2F] text-white font-semibold"
                          : "bg-[#F1EFEB] text-[#6B705C] hover:bg-[#E5E2DD]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}

                  {/* Favorite Toggle */}
                  <button
                    onClick={() => setFavoriteOnly(!favoriteOnly)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      favoriteOnly
                        ? "bg-[#FEFAE0] border-[#CCD5AE] text-[#D4A373] font-semibold"
                        : "bg-white border-[#E5E2DD] text-[#A9A29C] hover:bg-[#F1EFEB]"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favoriteOnly ? "fill-[#D4A373]" : ""}`} />
                    <span>중요</span>
                  </button>
                </div>
              </div>

              {/* Session Cards List */}
              {isLoading ? (
                <div className="text-center py-16">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#556B2F] mx-auto mb-2" />
                  <p className="text-xs text-[#6B705C]">서버에서 상담 기록을 불러오고 있습니다...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[32px] border border-[#E5E2DD] p-8">
                  <BookOpen className="w-12 h-12 text-[#CCD5AE] mx-auto mb-3" />
                  <h3 className="text-sm font-serif font-bold text-[#434B3E] mb-1">
                    보관된 상담 기록이 없습니다
                  </h3>
                  <p className="text-xs text-[#6B705C] max-w-xs mx-auto leading-relaxed">
                    상담실에서 AI 상담사와 대화를 나눈 후, 우측 상단의 <strong>[서버에 상담 저장]</strong> 버튼을 눌러 소중한 대화를 남겨보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sessions.map((session) => {
                    const badge = getPersonaBadge(session.persona);
                    const isExpanded = expandedSessionId === session.id;
                    const isEditingNote = editingNoteSessionId === session.id;
                    const formattedDate = new Date(session.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    });

                    return (
                      <div
                        key={session.id}
                        className="bg-white rounded-[28px] border border-[#E5E2DD] p-5 shadow-2xs hover:shadow-xs transition relative"
                      >
                        {/* Top Bar: Persona + Date + Favorite */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>

                            <span className="text-[11px] text-[#A9A29C] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formattedDate}</span>
                            </span>

                            <span className="text-[11px] text-[#A9AD99]">
                              메시지 {session.messages.length}개
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleToggleFavorite(session, e)}
                              className={`p-1.5 rounded-xl transition ${
                                session.isFavorite
                                  ? "text-[#D4A373] bg-[#FEFAE0]"
                                  : "text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB]"
                              }`}
                              title={session.isFavorite ? "중요 표시 해제" : "중요 표시"}
                            >
                              <Star
                                className={`w-4 h-4 ${session.isFavorite ? "fill-[#D4A373]" : ""}`}
                              />
                            </button>

                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="p-1.5 rounded-xl text-[#A9AD99] hover:text-[#8C5243] hover:bg-[#F7EFE9] transition"
                              title="서버에서 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm sm:text-base font-serif font-bold text-[#2D3436] mb-1.5">
                          {session.title}
                        </h3>

                        {/* Summary */}
                        {session.summary && (
                          <p className="text-xs text-[#6B705C] leading-relaxed mb-3">
                            {session.summary}
                          </p>
                        )}

                        {/* Tags */}
                        {session.tags && session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {session.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-2 py-0.5 rounded-lg bg-[#F1EFEB] text-[#434B3E] border border-[#E5E2DD]"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Teacher's Private Note */}
                        <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#E5E2DD] mb-3 text-xs">
                          <div className="flex items-center justify-between mb-1 text-[11px] font-medium text-[#7B8E7E]">
                            <span className="flex items-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              <span>선생님의 비공개 회고 메모</span>
                            </span>
                            {!isEditingNote && (
                              <button
                                onClick={(e) => handleStartEditNote(session, e)}
                                className="text-[10px] text-[#A9A29C] hover:text-[#556B2F] underline"
                              >
                                {session.notes ? "수정하기" : "메모 남기기"}
                              </button>
                            )}
                          </div>

                          {isEditingNote ? (
                            <div className="space-y-2 mt-1">
                              <textarea
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                rows={2}
                                placeholder="이 상담 후 스스로에게 해주고 싶은 말이나 결심을 적어두세요."
                                className="w-full p-2 rounded-xl bg-white border border-[#CCD5AE] text-xs focus:outline-none"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingNoteSessionId(null)}
                                  className="px-2.5 py-1 text-[11px] text-[#A9A29C] hover:bg-[#F1EFEB] rounded-lg"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleSaveNote(session.id)}
                                  className="px-3 py-1 text-[11px] bg-[#556B2F] text-white rounded-lg font-medium"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[#434B3E] italic">
                              {session.notes || "(남겨진 회고 메모가 없습니다.)"}
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions: View Transcript & Restore */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E2DD]/80">
                          <button
                            onClick={() =>
                              setExpandedSessionId(isExpanded ? null : session.id)
                            }
                            className="flex items-center gap-1 text-xs text-[#6B705C] hover:text-[#2D3436] font-medium"
                          >
                            <span>{isExpanded ? "대화 접기" : "전체 대화 펼쳐보기"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            id={`btn-restore-${session.id}`}
                            onClick={() => handleRestore(session)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E9EDC9] hover:bg-[#CCD5AE] text-[#556B2F] text-xs font-semibold transition shadow-2xs"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>이 대화 이어서 상담하기</span>
                          </button>
                        </div>

                        {/* Expanded Full Transcript */}
                        {isExpanded && (
                          <div className="mt-4 pt-3 border-t border-[#E5E2DD] space-y-2.5 bg-[#F1EFEB]/40 p-3.5 rounded-2xl max-h-60 overflow-y-auto">
                            <h4 className="text-[11px] font-serif font-bold text-[#434B3E] mb-2">
                              대화 전문 내역
                            </h4>
                            {session.messages.map((m, idx) => (
                              <div
                                key={m.id || idx}
                                className={`p-2.5 rounded-xl text-xs ${
                                  m.role === "user"
                                    ? "bg-white border border-[#E5E2DD] text-[#2D3436]"
                                    : "bg-[#FEFAE0] border border-[#CCD5AE] text-[#434B3E]"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-[#A9A29C] mb-1 font-semibold">
                                  <span>{m.role === "user" ? "선생님" : "상담사"}</span>
                                  <span>{m.timestamp}</span>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                  {m.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : activeTab === "trends" ? (
            /* Recharts Emotional Trends Section */
            <EmotionalTrendsChart
              sessions={allSessions.length > 0 ? allSessions : sessions}
              onRestoreSession={handleRestore}
            />
          ) : (
            /* Stats & Recovery Report Tab */
            <div className="space-y-5 animate-fadeIn">
              {/* Shortcut Banner to Recharts Trends */}
              <div
                onClick={() => {
                  soundFx.playSoftChime();
                  setActiveTab("trends");
                }}
                className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-[#FEFAE0] via-[#FDFBF7] to-[#E9EDC9]/60 border border-[#CCD5AE] flex items-center justify-between cursor-pointer hover:shadow-xs hover:border-[#556B2F]/40 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white text-[#556B2F] border border-[#CCD5AE] flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-serif font-bold text-[#2D3436]">
                        선생님 감정 변화 시계열 추이 (Recharts 시각화)
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#556B2F] text-white">
                        실시간 차트
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B705C] mt-0.5">
                      저장된 상담 세션의 체온 변화, 상담사별 긴장도, 상담 전후 회복 곡선을 인터랙티브 차트로 확인하세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#556B2F] shrink-0 pl-2">
                  <span className="hidden sm:inline">차트 보기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Summary Metric Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-5 rounded-[28px] bg-white border border-[#E5E2DD] shadow-2xs">
                  <span className="text-xs text-[#6B705C]">서버 보관 총 상담 세션</span>
                  <div className="text-2xl font-serif font-bold text-[#556B2F] mt-1">
                    {stats?.totalSessions || 0}회
                  </div>
                  <p className="text-[11px] text-[#A9AD99] mt-1">
                    언제든 다시 꺼내볼 수 있는 안전한 기록
                  </p>
                </div>

                <div className="p-5 rounded-[28px] bg-white border border-[#E5E2DD] shadow-2xs">
                  <span className="text-xs text-[#6B705C]">누적 마음 치유 대화</span>
                  <div className="text-2xl font-serif font-bold text-[#D4A373] mt-1">
                    {stats?.totalMessages || 0}개
                  </div>
                  <p className="text-[11px] text-[#A9AD99] mt-1">
                    선생님과 상담사가 주고받은 교감의 언어
                  </p>
                </div>

                <div className="p-5 rounded-[28px] bg-white border border-[#E5E2DD] shadow-2xs">
                  <span className="text-xs text-[#6B705C]">마지막 상담 일시</span>
                  <div className="text-sm font-semibold text-[#434B3E] mt-2 truncate">
                    {stats?.lastSessionDate
                      ? new Date(stats.lastSessionDate).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "기록 없음"}
                  </div>
                  <p className="text-[11px] text-[#A9AD99] mt-1">
                    꾸준한 마음 챙김의 기록
                  </p>
                </div>
              </div>

              {/* Persona Consultation Distribution */}
              <div className="p-6 rounded-[28px] bg-white border border-[#E5E2DD] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#2D3436]">
                    상담사 페르소나별 조언 통계
                  </h3>
                  <span className="text-xs text-[#A9A29C]">선생님이 가장 많이 찾은 피난처</span>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "warm", label: "토닥이 (온기·경청)", color: "bg-[#556B2F]" },
                    { key: "parent", label: "학부모 소통 코칭", color: "bg-[#D4A373]" },
                    { key: "discipline", label: "수석교사 멘토 (생활지도)", color: "bg-[#7B8E7E]" },
                    { key: "burnout", label: "번아웃·워라밸 코치", color: "bg-[#6B705C]" },
                  ].map((p) => {
                    const count = stats?.personaDistribution?.[p.key as CounselorPersona] || 0;
                    const total = stats?.totalSessions || 1;
                    const pct = Math.round((count / (total || 1)) * 100);

                    return (
                      <div key={p.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#434B3E]">{p.label}</span>
                          <span className="text-[#6B705C] font-semibold">
                            {count}회 ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-[#F1EFEB] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.color} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Stress / Distress Tags */}
              <div className="p-6 rounded-[28px] bg-white border border-[#E5E2DD] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#2D3436]">
                    자주 등장한 고민 키워드
                  </h3>
                  <span className="text-xs text-[#A9A29C]">내 마음을 힘들게 한 주원인</span>
                </div>

                {stats?.topTags && stats.topTags.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {stats.topTags.map((item) => (
                      <div
                        key={item.tag}
                        className="p-3 rounded-2xl bg-[#FEFAE0] border border-[#CCD5AE] text-center"
                      >
                        <span className="text-xs font-semibold text-[#556B2F]">
                          #{item.tag}
                        </span>
                        <div className="text-[11px] text-[#A9A29C] mt-0.5">
                          {item.count}회 언급됨
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#A9A29C]">아직 등록된 태그 데이터가 없습니다.</p>
                )}
              </div>

              {/* Security & Data Privacy Notice */}
              <div className="p-4 rounded-2xl bg-[#F1EFEB] border border-[#E5E2DD] text-xs text-[#6B705C] leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#556B2F] shrink-0 mt-0.5" />
                <div>
                  <strong>데이터 안전 및 개인정보 보호:</strong> 상담 기록은 백엔드 서버의 격리된 전용 파일 저장소에 안전하게 보관됩니다. 필요 시 상단의 <strong>[데이터 백업 다운로드]</strong>를 통해 언제든 개인 PC로 내려받아 백업하실 수 있습니다.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
