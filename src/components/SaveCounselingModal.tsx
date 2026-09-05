import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Save, 
  Check, 
  Tag, 
  FileText, 
  Heart, 
  Star, 
  ShieldCheck,
  Loader2,
  Flame,
} from "lucide-react";
import { ChatMessage, CounselorPersona, CounselingSession } from "../types";
import { autoSummarizeSession, saveSessionToServer } from "../utils/counselingApi";
import { soundFx } from "../utils/audio";

interface SaveCounselingModalProps {
  messages: ChatMessage[];
  persona: CounselorPersona;
  moodScore?: number;
  onClose: () => void;
  onSaved: (session: CounselingSession) => void;
  onOpenArchive: () => void;
}

const COMMON_TAGS = [
  "학부모소통",
  "교권보호",
  "생활지도",
  "업무과중",
  "자책감해소",
  "퇴근리추얼",
  "동료관계",
  "마음이완",
];

export const SaveCounselingModal: React.FC<SaveCounselingModalProps> = ({
  messages,
  persona,
  moodScore,
  onClose,
  onSaved,
  onOpenArchive,
}) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedMoodScore, setSelectedMoodScore] = useState<number>(moodScore || 3);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedSession, setSavedSession] = useState<CounselingSession | null>(null);

  // Initialize title
  useEffect(() => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const preview = firstUserMsg.content.slice(0, 24).replace(/\n/g, " ");
      setTitle(preview ? `${preview}...` : `상담 기록 (${new Date().toLocaleDateString("ko-KR")})`);
    } else {
      setTitle(`교사 마음 상담 (${new Date().toLocaleDateString("ko-KR")})`);
    }
  }, [messages]);

  const handleAutoSummarize = async () => {
    setIsSummarizing(true);
    soundFx.playSoftChime();
    try {
      const res = await autoSummarizeSession(messages, persona);
      if (res.title) setTitle(res.title);
      if (res.summary) setSummary(res.summary);
      if (res.tags && res.tags.length > 0) {
        setTags(Array.from(new Set([...tags, ...res.tags])));
      }
      soundFx.playSingingBowl();
    } catch {
      alert("자동 요약 생성에 실패했습니다. 직접 입력해 주세요.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    soundFx.playSoftChime();
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = (e.currentTarget.value || "").trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        e.currentTarget.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true);
    soundFx.playSoftChime();

    try {
      const created = await saveSessionToServer({
        title: title.trim(),
        summary: summary.trim() || "선생님의 마음에 귀 기울인 상담 기록입니다.",
        persona,
        messages,
        tags,
        moodScore: selectedMoodScore,
        notes: notes.trim(),
        isFavorite,
      });

      setSavedSession(created);
      setIsSuccess(true);
      soundFx.playSingingBowl();
      onSaved(created);
    } catch (err) {
      console.error(err);
      alert("상담 기록 저장 중 오류가 발생했습니다.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3436]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[36px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          id="btn-close-save-counseling"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-2xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            {/* Header Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>백엔드 서버 데이터 영구 보관</span>
            </div>

            <h2 className="text-xl font-serif font-bold text-[#2D3436] mb-1">
              현재 상담을 서버에 저장하기
            </h2>
            <p className="text-xs text-[#6B705C] mb-5 leading-relaxed">
              교실에서 나눈 소중한 대화와 위로를 서버에 안전하게 기록해 두세요. 나중에 언제든 다시 꺼내보고 이어서 상담할 수 있습니다.
            </p>

            {/* Quick Auto-Summarize Button */}
            <div className="mb-4">
              <button
                id="btn-auto-summarize"
                type="button"
                onClick={handleAutoSummarize}
                disabled={isSummarizing}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#FAEDCD] hover:bg-[#F5E6BD] border border-[#D4A373]/50 text-xs font-medium text-[#7A5B3E] flex items-center justify-center gap-2 transition shadow-2xs group"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4A373]" />
                    <span>AI가 상담 대화를 분석하고 요약 중입니다...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#D4A373] group-hover:rotate-12 transition-transform" />
                    <span>AI 자동 요약 & 키워드 태그 추출하기</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {/* Title Field */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#434B3E] mb-1.5">
                  상담 제목 <span className="text-[#8C5243]">*</span>
                </label>
                <input
                  id="input-counseling-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 3교시 돌발 행동 지도 후 마음 추스르기"
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E2DD] text-xs text-[#434B3E] placeholder:text-[#A9AD99] focus:outline-none focus:ring-2 focus:ring-[#CCD5AE]/40 focus:border-[#7B8E7E] transition"
                />
              </div>

              {/* Summary Field */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#434B3E] mb-1.5">
                  핵심 요약 (한눈에 보기)
                </label>
                <textarea
                  id="textarea-counseling-summary"
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="상담에서 얻은 위안이나 핵심 조언을 간략히 적어주세요."
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E2DD] text-xs text-[#434B3E] placeholder:text-[#A9AD99] focus:outline-none focus:ring-2 focus:ring-[#CCD5AE]/40 focus:border-[#7B8E7E] resize-none transition"
                />
              </div>

              {/* Mood / Emotional Stress Temperature Picker */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#434B3E] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#BC6C25]" />
                    <span>상담 당시 마음 온도 (스트레스 지수)</span>
                  </span>
                  <span className="text-[10px] text-[#556B2F] font-semibold">
                    {35.5 + selectedMoodScore * 1.0}°C
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { score: 1, temp: "36.5°C", label: "평온", color: "border-[#556B2F] text-[#556B2F] bg-[#E9EDC9]" },
                    { score: 2, temp: "37.5°C", label: "경미 피로", color: "border-[#7B8E7E] text-[#434B3E] bg-[#CCD5AE]/30" },
                    { score: 3, temp: "38.5°C", label: "답답/지침", color: "border-[#D4A373] text-[#8C5243] bg-[#FAEDCD]" },
                    { score: 4, temp: "39.5°C", label: "번아웃 경고", color: "border-[#BC6C25] text-[#BC6C25] bg-[#F7EFE9]" },
                    { score: 5, temp: "40.5°C", label: "응급 쉼터", color: "border-[#C85A5A] text-[#C85A5A] bg-[#FBEAEA]" },
                  ].map((tier) => {
                    const isSelected = selectedMoodScore === tier.score;
                    return (
                      <button
                        key={tier.score}
                        type="button"
                        onClick={() => {
                          soundFx.playSoftChime();
                          setSelectedMoodScore(tier.score);
                        }}
                        className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                          isSelected
                            ? `${tier.color} shadow-xs font-bold ring-2 ring-offset-1 ring-[#556B2F]/40`
                            : "bg-white border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB]"
                        }`}
                      >
                        <span className="text-xs font-serif font-bold">{tier.temp}</span>
                        <span className="text-[10px] mt-0.5 leading-tight">{tier.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#A9AD99] mt-1">
                  선택하신 마음 온도는 보관소의 <strong>Recharts 감정 변화 추이 차트</strong>에 시계열로 누적 기록됩니다.
                </p>
              </div>

              {/* Teacher's Private Note / Journal */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#434B3E] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#556B2F]" />
                    <span>선생님의 비공개 회고 메모 (나만의 일기)</span>
                  </span>
                  <span className="text-[10px] text-[#A9A29C] font-normal">선택 사항</span>
                </label>
                <textarea
                  id="textarea-counseling-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="예: 오늘 내 감정을 알아차리고 한 발짝 물러서는 연습을 했다. 내일은 출근하자마자 안심번호 설정을 켜두자."
                  className="w-full p-3 rounded-2xl bg-white border border-[#E5E2DD] text-xs text-[#434B3E] placeholder:text-[#A9AD99] focus:outline-none focus:ring-2 focus:ring-[#CCD5AE]/40 focus:border-[#7B8E7E] resize-none transition"
                />
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#434B3E] mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>마음 태그</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_TAGS.map((t) => {
                    const isSelected = tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleTag(t)}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border transition ${
                          isSelected
                            ? "bg-[#E9EDC9] border-[#CCD5AE] text-[#556B2F] font-semibold"
                            : "bg-white border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB]"
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="직접 태그 입력 후 Enter (예: 공문스트레스)"
                  onKeyDown={handleAddCustomTag}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E5E2DD] text-xs text-[#434B3E] placeholder:text-[#A9AD99] focus:outline-none focus:border-[#7B8E7E]"
                />
              </div>

              {/* Star / Favorite & Message Count Meta */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E5E2DD] text-xs">
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex items-center gap-2 font-medium transition ${
                    isFavorite ? "text-[#D4A373]" : "text-[#A9A29C] hover:text-[#434B3E]"
                  }`}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? "fill-[#D4A373]" : ""}`} />
                  <span>{isFavorite ? "중요 상담으로 지정됨" : "중요 상담으로 보관하기"}</span>
                </button>

                <div className="text-[11px] text-[#A9A29C]">
                  대화 메시지 <strong className="text-[#434B3E]">{messages.length}개</strong> 포함
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-5 mt-4 border-t border-[#E5E2DD]">
              <button
                id="btn-cancel-save-counseling"
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-medium text-[#A9A29C] hover:bg-[#F1EFEB] transition"
              >
                취소
              </button>
              <button
                id="btn-confirm-save-counseling"
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>서버 저장 중...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>서버에 안전하게 저장</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#E9EDC9] text-[#556B2F] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Check className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>백엔드 서버 저장 완료</span>
            </div>

            <h3 className="text-lg font-serif font-bold text-[#2D3436] mb-2">
              상담 기록이 성공적으로 보관되었습니다
            </h3>
            <p className="text-xs text-[#6B705C] max-w-sm mx-auto leading-relaxed mb-6">
              <strong>"{savedSession?.title}"</strong> 기록이 서버 저장소에 안전하게 등록되었습니다. 언제든 상담 보관소에서 다시 불러오거나 회고 메모를 확인하실 수 있습니다.
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                id="btn-view-archive-now"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenArchive();
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#FAEDCD] hover:bg-[#F5E6BD] border border-[#D4A373]/50 text-[#7A5B3E] text-xs font-semibold transition shadow-xs"
              >
                상담 보관소에서 확인하기
              </button>
              <button
                id="btn-finish-save-counseling"
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] text-white text-xs font-semibold transition shadow-xs"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
