import React from "react";
import { X, Thermometer, ArrowRight, Heart } from "lucide-react";
import { STRESS_LEVELS } from "../data/counselingData";
import { soundFx } from "../utils/audio";

interface StressCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  onSelectStress: (score: number, promptToChat?: string) => void;
}

export const StressCheckModal: React.FC<StressCheckModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  onSelectStress,
}) => {
  if (!isOpen) return null;

  const handleSelect = (score: number, label: string, tempText: string) => {
    soundFx.playSoftChime();
    const prompt = `현재 저의 마음 온도는 ${tempText} (${label}) 상태입니다. 오늘 교단에서 겪은 피로와 복잡한 심경을 함께 나누고 마음을 추스르고 싶어요.`;
    onSelectStress(score, prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3436]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[40px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          id="btn-close-stress"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-2xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
          <Thermometer className="w-3.5 h-3.5 text-[#556B2F]" />
          <span>오늘 나의 마음 온도계</span>
        </div>

        <h2 className="text-xl font-serif font-bold text-[#2D3436] mb-1">
          선생님의 마음 온도는 오늘 몇 도인가요?
        </h2>
        <p className="text-xs text-[#6B705C] mb-6">
          자신의 상태를 솔직하게 인정하는 것만으로도 치유는 이미 시작됩니다.
        </p>

        <div className="space-y-2.5 mb-6">
          {STRESS_LEVELS.map((item) => {
            const isSelected = currentScore === item.score;
            return (
              <button
                key={item.score}
                onClick={() => handleSelect(item.score, item.label, item.tempText)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-[#E9EDC9] border-[#CCD5AE] shadow-xs"
                    : "bg-white border-[#E5E2DD] hover:bg-[#F1EFEB] hover:border-[#CCD5AE]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-serif font-bold px-2.5 py-1 rounded-xl ${
                      item.score >= 4
                        ? "bg-[#FAEDCD] text-[#7A5B3E]"
                        : item.score >= 3
                        ? "bg-[#FEFAE0] text-[#7A5B3E] border border-[#CCD5AE]"
                        : "bg-[#E9EDC9] text-[#556B2F]"
                    }`}
                  >
                    {item.tempText}
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#2D3436]">
                      {item.label}
                    </h3>
                    <p className="text-[11px] text-[#6B705C] mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="text-[#A9A29C] flex items-center gap-1 text-xs">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FEFAE0] border border-[#CCD5AE] text-xs text-[#556B2F] flex items-start gap-2.5">
          <Heart className="w-4 h-4 text-[#D4A373] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            온도를 선택하시면 그에 맞는 맞춤형 위로 메시지와 함께 상담 채팅창에 상황이 자동으로 연동됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
