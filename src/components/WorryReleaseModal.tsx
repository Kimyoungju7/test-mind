import React, { useState } from "react";
import { X, Feather, Send, CheckCircle2, Sparkles } from "lucide-react";
import { soundFx } from "../utils/audio";

interface WorryReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorryReleaseModal: React.FC<WorryReleaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [worryText, setWorryText] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);
  const [isReleased, setIsReleased] = useState(false);

  if (!isOpen) return null;

  const handleRelease = () => {
    if (!worryText.trim()) return;

    setIsReleasing(true);
    soundFx.playReleaseWhoosh();

    setTimeout(() => {
      setIsReleasing(false);
      setIsReleased(true);
    }, 1200);
  };

  const handleReset = () => {
    setWorryText("");
    setIsReleased(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3436]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[40px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          id="btn-close-worry"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-2xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!isReleased ? (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
              <Feather className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>퇴근길 마음 정화 리추얼</span>
            </div>

            <h2 className="text-xl font-serif font-bold text-[#2D3436] mb-1">
              학교에 두고 갈 무거운 마음 흘려보내기
            </h2>
            <p className="text-xs text-[#6B705C] mb-5 leading-relaxed">
              오늘 교실에서 들었던 상처가 되는 말, 가슴을 짓누르는 학부모 연락, 끝내지 못한 공문...
              집까지 들고 가지 마시고 이곳에 적어두고 교문 밖으로 훨훨 날려보내세요.
            </p>

            <div className={`relative transition-all duration-1000 ${isReleasing ? "opacity-0 scale-95 translate-y-[-20px] filter blur-xs" : "opacity-100"}`}>
              <textarea
                id="input-worry-text"
                rows={4}
                value={worryText}
                onChange={(e) => setWorryText(e.target.value)}
                placeholder="예: 오늘 수업 중 아이가 던진 날카로운 말 한마디가 계속 맴돌아요... 내가 무엇을 잘못했을까 자책하게 돼요."
                className="w-full p-4 rounded-2xl bg-white border border-[#E5E2DD] text-[#434B3E] text-xs sm:text-sm placeholder:text-[#A9AD99] focus:outline-none focus:ring-2 focus:ring-[#CCD5AE]/40 focus:border-[#7B8E7E] resize-none transition"
              />

              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 mb-5">
                <span className="text-[11px] text-[#A9A29C]">자주 남기는 고민:</span>
                {[
                  "오늘 받은 날선 학부모 연락",
                  "통제되지 않던 3교시 교실",
                  "내 탓인 것만 같은 자책감",
                  "산더미 같은 공문과 잡무"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setWorryText((prev) => (prev ? `${prev} ${chip}` : chip))}
                    className="text-[11px] bg-[#F1EFEB] hover:bg-[#E9EDC9] text-[#6B705C] hover:text-[#556B2F] px-3 py-1 rounded-xl border border-[#E5E2DD] hover:border-[#CCD5AE] transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E2DD]">
              <button
                id="btn-cancel-worry"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-medium text-[#A9A29C] hover:bg-[#F1EFEB] transition"
              >
                닫기
              </button>
              <button
                id="btn-release-worry"
                onClick={handleRelease}
                disabled={!worryText.trim() || isReleasing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isReleasing ? "바람에 흩날려 보내는 중..." : "교문에 두고 떠나기"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-[#E9EDC9] text-[#556B2F] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>깨끗하게 비워졌습니다</span>
            </div>

            <h3 className="text-lg font-serif font-bold text-[#2D3436] mb-2">
              잘 하셨습니다, 선생님.
            </h3>
            <p className="text-xs text-[#6B705C] max-w-sm mx-auto leading-relaxed mb-6">
              선생님을 괴롭히던 무거운 생각들은 학교의 닫힌 문 너머로 사라졌습니다.<br />
              이제부터는 오롯이 <strong>선생님 자신의 다정한 저녁</strong>입니다. 맛있는 것을 드시고, 깊은 숨을 내쉬어주세요.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                id="btn-write-another-worry"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-2xl border border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB] text-xs font-medium transition"
              >
                다른 걱정도 비우기
              </button>
              <button
                id="btn-done-worry"
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] text-white text-xs font-semibold transition shadow-xs"
              >
                가벼운 마음으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
