import React, { useState } from "react";
import { 
  Heart, 
  Wind, 
  Trash2, 
  Thermometer, 
  Volume2, 
  VolumeX, 
  PhoneCall, 
  Sparkles,
  X,
  BookOpen
} from "lucide-react";
import { soundFx } from "../utils/audio";
import { TEACHER_HOTLINES } from "../data/counselingData";

interface HeaderProps {
  onOpenBreathing: () => void;
  onOpenWorryRelease: () => void;
  onOpenStressCheck: () => void;
  onOpenPrescription: () => void;
  onOpenArchive: () => void;
  stressTemp: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBreathing,
  onOpenWorryRelease,
  onOpenStressCheck,
  onOpenPrescription,
  onOpenArchive,
  stressTemp,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHotlineModal, setShowHotlineModal] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
    if (next) soundFx.playSoftChime();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5E2DD] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#7B8E7E] flex items-center justify-center text-white shadow-xs">
                <div className="w-4 h-4 bg-white rounded-full opacity-85 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 fill-[#7B8E7E] text-[#7B8E7E]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-serif font-semibold tracking-tight text-[#556B2F]">
                    숲결 : 교사 마음 쉼터
                  </h1>
                  <span className="text-[11px] font-medium bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] px-2.5 py-0.5 rounded-full">
                    치유 쉼표
                  </span>
                </div>
                <p className="text-xs text-[#6B705C] hidden sm:block font-sans">
                  아이들의 소란함 뒤로 남겨진 선생님의 지친 마음을 위한 AI 힐링 쉼터
                </p>
              </div>
            </div>

            {/* Mobile-only Sound & Hotline Toggle */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                id="btn-sound-mobile"
                onClick={toggleSound}
                className="p-2 rounded-2xl text-[#6B705C] hover:bg-[#F1EFEB] border border-[#E5E2DD]"
                title={soundEnabled ? "소리 끄기" : "소리 켜기"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#556B2F]" /> : <VolumeX className="w-4 h-4 text-[#A9AD99]" />}
              </button>
              <button
                id="btn-hotline-mobile"
                onClick={() => setShowHotlineModal(true)}
                className="p-2 rounded-2xl text-[#8C5243] hover:bg-[#F7EFE9] border border-[#DFCCC5]"
                title="교원 긴급 핫라인"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Healing Quick Action Bar */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
            {/* Stress Temp Button */}
            <button
              id="btn-stress-check"
              onClick={onOpenStressCheck}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-2xl bg-[#FAEDCD] hover:bg-[#F5E6BD] text-[#7A5B3E] border border-[#D4A373]/50 transition shadow-2xs"
            >
              <Thermometer className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>마음 온도</span>
              <span className="font-semibold text-[#5D4037] bg-[#D4A373]/20 px-1.5 py-0.5 rounded-md">
                {stressTemp}
              </span>
            </button>

            {/* Mindful Breathing */}
            <button
              id="btn-breathing"
              onClick={onOpenBreathing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-2xl bg-[#E9EDC9] hover:bg-[#CCD5AE] text-[#556B2F] border border-[#CCD5AE] transition shadow-2xs"
            >
              <Wind className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>4-7-8 이완 호흡</span>
            </button>

            {/* Prescription Card */}
            <button
              id="btn-prescription"
              onClick={onOpenPrescription}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-2xl bg-[#FEFAE0] hover:bg-[#F7F2D0] text-[#6B705C] border border-[#E0E2D9] transition shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>마음 처방전</span>
            </button>

            {/* Worry Release (퇴근 리추얼) */}
            <button
              id="btn-worry-release"
              onClick={onOpenWorryRelease}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-2xl bg-[#F1EFEB] hover:bg-[#E5E2DD] text-[#434B3E] border border-[#E5E2DD] transition shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#7B8E7E]" />
              <span>학교에 걱정 비우기</span>
            </button>

            {/* Counseling Archive (상담 일지 & 기록 관리) */}
            <button
              id="btn-header-archive"
              onClick={onOpenArchive}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-[#556B2F] hover:bg-[#435425] text-white transition shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E9EDC9]" />
              <span>상담 보관소</span>
            </button>

            {/* Sound Toggle (Desktop) */}
            <button
              id="btn-sound-desktop"
              onClick={toggleSound}
              className="hidden md:flex items-center p-2 rounded-2xl text-[#6B705C] hover:bg-[#F1EFEB] border border-[#E5E2DD] transition"
              title={soundEnabled ? "소리 효과 켜짐" : "소리 효과 꺼짐"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#556B2F]" /> : <VolumeX className="w-4 h-4 text-[#A9AD99]" />}
            </button>

            {/* Hotline (Desktop) */}
            <button
              id="btn-hotline-desktop"
              onClick={() => setShowHotlineModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-2xl bg-[#F7EFE9] hover:bg-[#F2E5DC] text-[#8C5243] border border-[#DFCCC5] transition shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#8C5243]" />
              <span>교원 지원 안내</span>
            </button>
          </div>
        </div>
      </header>

      {/* Teacher Hotlines Modal */}
      {showHotlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3436]/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-xl relative">
            <button
              id="btn-close-hotlines"
              onClick={() => setShowHotlineModal(false)}
              className="absolute top-5 right-5 p-1.5 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#F7EFE9] text-[#8C5243] flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#2D3436]">교원 안심 & 심리 회복 긴급 안내</h2>
                <p className="text-xs text-[#6B705C]">선생님은 혼자가 아닙니다. 든든한 숲 그늘 같은 안전망입니다.</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {TEACHER_HOTLINES.map((hl) => (
                <div
                  key={hl.name}
                  className="p-4 rounded-2xl bg-white border border-[#E5E2DD] flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <h3 className="text-xs font-semibold text-[#434B3E]">{hl.name}</h3>
                    <p className="text-[11px] text-[#A9A29C] mt-0.5">{hl.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-[#8C5243] bg-[#F7EFE9] px-2.5 py-1 rounded-xl border border-[#DFCCC5]">
                    {hl.tel}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-[#FEFAE0] border border-[#CCD5AE] rounded-2xl text-xs text-[#556B2F] leading-relaxed mb-5">
              💡 <strong>선생님을 위한 알림:</strong> 교육활동 침해나 학부모의 과도한 폭언/협박 발생 시, 통화 녹음 및 일자별 기록을 남기시고 학교 민원대응팀 및 관할 교원치유지원센터의 법률·심리상담 조력을 받으실 수 있습니다.
            </div>

            <button
              id="btn-confirm-hotline"
              onClick={() => setShowHotlineModal(false)}
              className="w-full py-3 rounded-2xl bg-[#556B2F] hover:bg-[#435425] text-white text-xs font-medium transition shadow-xs"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </>
  );
};
