import React, { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { soundFx } from "../utils/audio";

interface MindfulBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = "ready" | "inhale" | "hold" | "exhale";

export const MindfulBreathingModal: React.FC<MindfulBreathingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("ready");
  const [countdown, setCountdown] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsActive(false);
      setPhase("ready");
      setCountdown(4);
      setCycleCount(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Phase Transition
        if (phase === "ready" || phase === "exhale") {
          setPhase("inhale");
          soundFx.playSingingBowl();
          return 4;
        } else if (phase === "inhale") {
          setPhase("hold");
          return 7;
        } else if (phase === "hold") {
          setPhase("exhale");
          setCycleCount((c) => c + 1);
          return 8;
        }
        return 4;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase]);

  if (!isOpen) return null;

  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      setPhase("inhale");
      setCountdown(4);
      soundFx.playSingingBowl();
    } else {
      setIsActive(false);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase("ready");
    setCountdown(4);
    setCycleCount(0);
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case "inhale":
        return {
          title: "코로 깊게 들이마시세요",
          desc: "교실에서 쌓인 긴장을 풀며 맑은 숲의 숨을 가득 채웁니다",
          color: "text-[#556B2F]",
          ringColor: "border-[#CCD5AE] bg-[#E9EDC9]/40",
          scale: "scale-125 duration-[4000ms]",
        };
      case "hold":
        return {
          title: "숨을 잠시 멈추세요",
          desc: "가슴 안쪽의 고요함을 가만히 느껴봅니다",
          color: "text-[#D4A373]",
          ringColor: "border-[#D4A373]/60 bg-[#FEFAE0]",
          scale: "scale-125 duration-[7000ms]",
        };
      case "exhale":
        return {
          title: "입으로 가늘고 길게 내쉬세요",
          desc: "오늘 나를 아프게 했던 모든 걱정과 무거움을 내보냅니다",
          color: "text-[#7B8E7E]",
          ringColor: "border-[#E5E2DD] bg-[#F1EFEB]",
          scale: "scale-90 duration-[8000ms]",
        };
      default:
        return {
          title: "준비되셨나요?",
          desc: "가슴을 펴고 어깨의 힘을 툭 빼주세요",
          color: "text-[#434B3E]",
          ringColor: "border-[#E5E2DD] bg-white",
          scale: "scale-100",
        };
    }
  };

  const currentInfo = getPhaseInstruction();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3436]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[40px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
        <button
          id="btn-close-breathing"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-2xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
          <span>4-7-8 자율신경 이완 호흡</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-[#2D3436] mb-1">
          긴장된 가슴을 풀어주는 숲의 쉼표
        </h2>
        <p className="text-xs text-[#6B705C] mb-8 max-w-xs mx-auto">
          학부모 전화나 수업 중 쿵쾅거렸던 심장을 차분히 가라앉히는 교사 맞춤 호흡법입니다.
        </p>

        {/* Dynamic Breathing Visualizer */}
        <div className="relative flex items-center justify-center h-56 mb-8">
          {/* Outer gentle halo */}
          <div
            className={`w-48 h-48 rounded-full border-2 transition-all ease-in-out ${currentInfo.ringColor} ${currentInfo.scale} flex items-center justify-center shadow-inner`}
          >
            {/* Inner Core */}
            <div className="w-32 h-32 rounded-full bg-white/95 shadow-sm border border-[#E5E2DD] flex flex-col items-center justify-center p-2">
              <span className="text-3xl font-serif font-extrabold text-[#2D3436] tracking-tight">
                {isActive ? countdown : "4-7-8"}
              </span>
              <span className={`text-xs font-semibold mt-1 ${currentInfo.color}`}>
                {phase === "ready"
                  ? "시작 대기"
                  : phase === "inhale"
                  ? "들이쉬기"
                  : phase === "hold"
                  ? "멈춤"
                  : "내쉬기"}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="min-h-[50px] mb-6">
          <h3 className={`text-sm font-serif font-bold transition-all ${currentInfo.color}`}>
            {currentInfo.title}
          </h3>
          <p className="text-xs text-[#6B705C] mt-1">
            {currentInfo.desc}
          </p>
        </div>

        {/* Cycle Count */}
        <div className="flex items-center justify-center gap-4 text-xs text-[#A9A29C] mb-6">
          <span>완료한 호흡 주기: <strong className="text-[#556B2F] font-semibold">{cycleCount}회</strong></span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            id="btn-breathing-toggle"
            onClick={handleToggle}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-xs text-white transition shadow-sm ${
              isActive
                ? "bg-[#6B705C] hover:bg-[#555A4B]"
                : "bg-[#556B2F] hover:bg-[#435425]"
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4" />
                <span>일시 정지</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>호흡 시작하기</span>
              </>
            )}
          </button>

          <button
            id="btn-breathing-reset"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB] text-xs font-medium transition"
            title="처음으로 리셋"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시</span>
          </button>
        </div>
      </div>
    </div>
  );
};
