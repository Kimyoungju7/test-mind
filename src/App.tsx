import React, { useState } from "react";
import { Header } from "./components/Header";
import { ChatSection } from "./components/ChatSection";
import { MindfulBreathingModal } from "./components/MindfulBreathingModal";
import { WorryReleaseModal } from "./components/WorryReleaseModal";
import { StressCheckModal } from "./components/StressCheckModal";
import { PrescriptionModal } from "./components/PrescriptionModal";
import { CounselingArchiveModal } from "./components/CounselingArchiveModal";
import { DAILY_AFFIRMATIONS, STRESS_LEVELS } from "./data/counselingData";
import { CounselingSession } from "./types";
import { 
  Sparkles, 
  Wind, 
  Trash2, 
  Sun, 
  Moon, 
  HeartHandshake, 
  Check, 
  RefreshCw,
  PhoneCall,
  BookOpen,
  Database
} from "lucide-react";
import { soundFx } from "./utils/audio";

export default function App() {
  // Modal states
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isWorryReleaseOpen, setIsWorryReleaseOpen] = useState(false);
  const [isStressCheckOpen, setIsStressCheckOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Restored session state
  const [restoredSession, setRestoredSession] = useState<CounselingSession | null>(null);

  // Stress State
  const [stressScore, setStressScore] = useState(2);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Daily Affirmation Index
  const [affirmationIdx, setAffirmationIdx] = useState(0);

  // Off-Duty Switch ("퇴근 스위치")
  const [isOffDuty, setIsOffDuty] = useState(false);

  // Daily Compliment Stamps
  const [compliments, setCompliments] = useState<Record<string, boolean>>({
    breath: false,
    patience: false,
    leaveOnTime: false,
  });

  const currentStress = STRESS_LEVELS.find((s) => s.score === stressScore) || STRESS_LEVELS[1];

  const handleNextAffirmation = () => {
    soundFx.playSoftChime();
    setAffirmationIdx((prev) => (prev + 1) % DAILY_AFFIRMATIONS.length);
  };

  const handleToggleOffDuty = () => {
    const next = !isOffDuty;
    setIsOffDuty(next);
    soundFx.playSingingBowl();
  };

  const handleToggleCompliment = (key: string) => {
    soundFx.playSoftChime();
    setCompliments((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectStress = (score: number, promptToChat?: string) => {
    setStressScore(score);
    if (promptToChat) {
      setChatInitialPrompt(promptToChat);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#434B3E] flex flex-col font-sans selection:bg-[#CCD5AE] selection:text-[#2D3436]">
      {/* Top Header */}
      <Header
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onOpenWorryRelease={() => setIsWorryReleaseOpen(true)}
        onOpenStressCheck={() => setIsStressCheckOpen(true)}
        onOpenPrescription={() => setIsPrescriptionOpen(true)}
        onOpenArchive={() => setIsArchiveOpen(true)}
        stressTemp={currentStress.tempText}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Chat Interface (8 Cols on lg, full on mobile) */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-4">
            <ChatSection
              onOpenBreathing={() => setIsBreathingOpen(true)}
              onOpenArchive={() => setIsArchiveOpen(true)}
              initialPrompt={chatInitialPrompt}
              onClearInitialPrompt={() => setChatInitialPrompt(undefined)}
              restoredSession={restoredSession}
              onClearRestoredSession={() => setRestoredSession(null)}
              stressScore={stressScore}
            />
          </div>

          {/* Right Companion Care Sidebar (4 Cols on lg) */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* Backend Counseling Records Manager Card */}
            <div className="p-5 rounded-[32px] bg-white border border-[#E5E2DD] shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E9EDC9] text-[#556B2F] flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-bold text-[#2D3436]">
                      교사 상담 일지 & 보관소
                    </h3>
                    <span className="text-[10px] text-[#556B2F] font-medium flex items-center gap-1">
                      <Database className="w-2.5 h-2.5" />
                      백엔드 서버 데이터 영구 보관
                    </span>
                  </div>
                </div>

                <button
                  id="btn-sidebar-open-archive"
                  onClick={() => setIsArchiveOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#556B2F] hover:bg-[#435425] text-white text-[11px] font-semibold transition shadow-2xs"
                >
                  보관소 열기
                </button>
              </div>

              <p className="text-[11px] text-[#6B705C] leading-relaxed mb-3">
                서버에 안전하게 저장된 이전 상담 내역, AI 핵심 요약, 감정 태그와 나만의 회고 메모를 조회하고 언제든 대화를 이어서 진행할 수 있습니다.
              </p>

              <div className="pt-2.5 border-t border-[#E5E2DD] flex items-center justify-between text-[11px] text-[#7B8E7E]">
                <span>상담 통계 및 분석 지원</span>
                <span className="text-[#556B2F] font-medium">JSON 백업 가능</span>
              </div>
            </div>

            {/* Off-Duty Ritual Switch */}
            <div
              className={`p-6 rounded-[32px] border transition-all duration-300 shadow-2xs ${
                isOffDuty
                  ? "bg-[#556B2F] text-white border-[#435425] shadow-md"
                  : "bg-[#F1EFEB] border-[#E5E2DD] text-[#434B3E]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      isOffDuty ? "bg-white/20 text-[#E9EDC9]" : "bg-[#E9EDC9] text-[#556B2F]"
                    }`}
                  >
                    {isOffDuty ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-serif font-bold tracking-tight">퇴근 모드 스위치</h3>
                    <p className={`text-[11px] ${isOffDuty ? "text-[#E9EDC9]" : "text-[#6B705C]"}`}>
                      {isOffDuty ? "학교와의 연결을 끈 온전한 나만의 밤" : "학교 업무와 마음 분리하기"}
                    </p>
                  </div>
                </div>

                <button
                  id="btn-toggle-offduty"
                  onClick={handleToggleOffDuty}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isOffDuty ? "bg-[#CCD5AE]" : "bg-[#D5D2CD]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isOffDuty ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isOffDuty ? "bg-white/15 text-[#FEFAE0]" : "bg-white text-[#6B705C] border border-[#E5E2DD]"
                }`}
              >
                {isOffDuty ? (
                  <p>
                    🌿 <strong>퇴근 모드가 켜졌습니다.</strong> 교문의 문은 닫혔고, 나이스와 학부모 연락은 내일의 학교에 있습니다. 지금 이 순간만큼은 오롯이 따뜻한 숲의 쉼표를 누려주세요.
                  </p>
                ) : (
                  <p>
                    스위치를 켜면 교사로서의 무거운 책임을 교문에 내려놓고, 온전한 자연인으로서의 저녁을 맞이하는 심리적 숲길 모드로 전환됩니다.
                  </p>
                )}
              </div>
            </div>

            {/* Daily Affirmation Card */}
            <div className="p-6 rounded-[32px] bg-white border border-[#E5E2DD] shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#556B2F]">
                  <span className="w-4 h-[1px] bg-[#D4A373]"></span>
                  <Sparkles className="w-4 h-4 text-[#D4A373]" />
                  <span>오늘의 교사 위로</span>
                </div>
                <button
                  id="btn-next-affirmation"
                  onClick={handleNextAffirmation}
                  className="text-[11px] text-[#A9A29C] hover:text-[#556B2F] flex items-center gap-1 transition"
                  title="다른 위로 문구 보기"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>새로고침</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#2D3436] bg-[#FEFAE0] p-4 rounded-2xl border border-[#CCD5AE] italic">
                "{DAILY_AFFIRMATIONS[affirmationIdx]}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-[#A9AD99] pt-1">
                <span>지친 순간마다 되새기는 한 줄</span>
                <span className="font-semibold text-[#556B2F]">
                  {affirmationIdx + 1} / {DAILY_AFFIRMATIONS.length}
                </span>
              </div>
            </div>

            {/* Daily Self-Compassion Stamps */}
            <div className="p-6 rounded-[32px] bg-white border border-[#E5E2DD] shadow-sm space-y-3.5">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#556B2F]" />
                <h3 className="text-xs font-serif font-bold text-[#434B3E]">
                  오늘 나를 위한 셀프 칭찬 스탬프
                </h3>
              </div>
              <p className="text-[11px] text-[#6B705C]">
                남들은 몰라줘도 오늘 내가 해낸 소중한 일들을 직접 칭찬해 주세요.
              </p>

              <div className="space-y-2">
                {[
                  {
                    key: "breath",
                    text: "힘든 순간에 감정적으로 대응하지 않고 심호흡한 나",
                  },
                  {
                    key: "patience",
                    text: "다치거나 큰 사고 없이 교실을 무사히 지켜낸 나",
                  },
                  {
                    key: "leaveOnTime",
                    text: "무리하지 않고 나 자신을 위해 퇴근 시간을 챙긴 나",
                  },
                ].map((item) => {
                  const isChecked = compliments[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleToggleCompliment(item.key)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition ${
                        isChecked
                          ? "bg-[#E9EDC9] border-[#CCD5AE] text-[#556B2F] font-semibold"
                          : "bg-[#FDFBF7] border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB]"
                      }`}
                    >
                      <span className="line-clamp-1">{item.text}</span>
                      <div
                        className={`w-5 h-5 rounded-xl flex items-center justify-center shrink-0 ml-2 ${
                          isChecked
                            ? "bg-[#556B2F] text-white"
                            : "border border-[#CCD5AE] text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Healing Shortcuts */}
            <div className="p-6 rounded-[32px] bg-[#F1EFEB] border border-[#E5E2DD] shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-serif font-bold text-[#434B3E]">
                  선생님을 위한 마음 회복 도구함
                </h3>
                <span className="text-[11px] text-[#9B948E]">숲의 쉼표</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsBreathingOpen(true)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-[#E9EDC9] border border-[#E5E2DD] hover:border-[#CCD5AE] text-left transition shadow-2xs group"
                >
                  <Wind className="w-4 h-4 text-[#556B2F] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#434B3E]">4-7-8 호흡</div>
                  <div className="text-[10px] text-[#A9A29C]">긴장 이완 훈련</div>
                </button>

                <button
                  onClick={() => setIsWorryReleaseOpen(true)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-[#F2F4E8] border border-[#E5E2DD] hover:border-[#CCD5AE] text-left transition shadow-2xs group"
                >
                  <Trash2 className="w-4 h-4 text-[#7B8E7E] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#434B3E]">걱정 비우기</div>
                  <div className="text-[10px] text-[#A9A29C]">퇴근길 리추얼</div>
                </button>

                <button
                  onClick={() => setIsPrescriptionOpen(true)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-[#FEFAE0] border border-[#E5E2DD] hover:border-[#CCD5AE] text-left transition shadow-2xs group"
                >
                  <Sparkles className="w-4 h-4 text-[#D4A373] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#434B3E]">마음 처방전</div>
                  <div className="text-[10px] text-[#A9A29C]">맞춤 힐링 카드</div>
                </button>

                <button
                  onClick={() => setIsStressCheckOpen(true)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-[#FAEDCD] border border-[#E5E2DD] hover:border-[#D4A373]/50 text-left transition shadow-2xs group"
                >
                  <Sun className="w-4 h-4 text-[#D4A373] mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-[#434B3E]">마음 온도계</div>
                  <div className="text-[10px] text-[#A9A29C]">현재 상태 체크</div>
                </button>
              </div>
            </div>

            {/* Safe Legal & Emergency Banner */}
            <div className="p-4 rounded-2xl bg-[#FEFAE0]/80 border border-[#CCD5AE] text-[11px] text-[#556B2F] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#556B2F]">
                <PhoneCall className="w-3.5 h-3.5 text-[#556B2F]" />
                <span>선생님의 권익과 마음을 보호합니다</span>
              </div>
              <p className="leading-relaxed text-[#6B705C]">
                교육활동 침해 또는 심각한 악성 민원은 교원치유지원센터 및 교권보호위원회의 보호 절차를 밟으실 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-[#9B948E] border-t border-[#E5E2DD] bg-[#FDFBF7]">
        <p>
          숲결 : 교사 마음 쉼터 • 대한민국 모든 선생님들의 건강하고 평화로운 교단을 응원합니다.
        </p>
      </footer>

      {/* Modals */}
      <MindfulBreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />

      <WorryReleaseModal
        isOpen={isWorryReleaseOpen}
        onClose={() => setIsWorryReleaseOpen(false)}
      />

      <StressCheckModal
        isOpen={isStressCheckOpen}
        onClose={() => setIsStressCheckOpen(false)}
        currentScore={stressScore}
        onSelectStress={handleSelectStress}
      />

      <PrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
        onSendToChat={(text) => {
          setChatInitialPrompt(text);
          setIsPrescriptionOpen(false);
        }}
      />

      {isArchiveOpen && (
        <CounselingArchiveModal
          onClose={() => setIsArchiveOpen(false)}
          onRestoreSession={(session) => {
            setRestoredSession(session);
          }}
        />
      )}
    </div>
  );
}
