import React, { useState } from "react";
import { X, Sparkles, Coffee, Heart, Check, Copy, MessageSquareHeart, RefreshCw } from "lucide-react";
import { MindPrescription } from "../types";
import { soundFx } from "../utils/audio";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [feeling, setFeeling] = useState("극심한 피로와 번아웃");
  const [trigger, setTrigger] = useState("끝없는 학부모 연락과 수업 지도 스트레스");
  const [prescription, setPrescription] = useState<MindPrescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    soundFx.playSoftChime();

    try {
      const res = await fetch("/api/prescribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeling, trigger }),
      });

      if (!res.ok) throw new Error("처방전 생성 실패");
      const data = await res.json();
      setPrescription(data);
      soundFx.playSingingBowl();
    } catch {
      // Fallback
      setPrescription({
        title: "고단한 하루를 버텨낸 선생님을 위한 쉼표 처방전",
        empathy: "오늘 교실이라는 거친 파도 속에서도 선생님의 자리를 굳건히 지켜내시느라 진심으로 수고 많으셨습니다. 세상의 어떤 기준보다 지금 가장 소중한 것은 선생님 자신의 안녕입니다.",
        rxAction: "퇴근길 학교 메신저 알림을 모두 끄고, 좋아하는 따뜻한 음료를 마시며 좋아하는 음악 1곡을 온전히 감상하기",
        mantra: "학교의 일은 교문에 두고, 나는 나의 고요한 저녁으로 당당히 걸어갑니다.",
        teaRecommendation: "향긋하고 마음을 가라앉히는 캐모마일 티"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!prescription) return;
    const text = `[오늘의 교사 마음 처방전: ${prescription.title}]\n\n${prescription.empathy}\n\n- 실천 처방: ${prescription.rxAction}\n- 마음 만트라: "${prescription.mantra}"\n- 추천 차: ${prescription.teaRecommendation}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartChatWithPrescription = () => {
    if (!prescription || !onSendToChat) return;
    const msg = `오늘 발급받은 마음 처방전: "${prescription.title}"을 보고 왔어요. "${prescription.mantra}"라는 말이 마음에 와닿는데, 오늘 있었던 힘든 일에 대해 더 깊이 이야기 나누고 싶어요.`;
    onSendToChat(msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D3436]/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FDFBF7] border border-[#E5E2DD] rounded-[40px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          id="btn-close-prescription"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#A9AD99] hover:text-[#434B3E] hover:bg-[#F1EFEB] rounded-2xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E9EDC9] text-[#556B2F] border border-[#CCD5AE] text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#556B2F]" />
          <span>교사 전용 힐링 리추얼</span>
        </div>

        <h2 className="text-xl font-serif font-bold text-[#2D3436] mb-1">
          오늘의 맞춤 마음 처방전
        </h2>
        <p className="text-xs text-[#6B705C] mb-6">
          오늘 선생님의 상태에 꼭 맞춘 위로 글귀와 셀프케어 실천 카드를 조제해 드립니다.
        </p>

        {!prescription ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold text-[#434B3E] mb-2">
                1. 오늘 나의 주된 감정 상태
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "극심한 피로와 번아웃",
                  "자책감과 무력감",
                  "학부모 민원으로 상처받음",
                  "통제 안 되는 교실로 속상함"
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFeeling(item)}
                    className={`p-3 rounded-2xl text-xs font-medium border text-left transition ${
                      feeling === item
                        ? "bg-[#E9EDC9] border-[#CCD5AE] text-[#556B2F] font-semibold shadow-2xs"
                        : "bg-white border-[#E5E2DD] text-[#6B705C] hover:bg-[#F1EFEB]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-[#434B3E] mb-2">
                2. 나를 가장 힘들게 한 원인
              </label>
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="예: 퇴근 후 불시 학부모 연락, 과도한 공문, 학생의 거친 말"
                className="w-full p-3.5 rounded-2xl bg-white border border-[#E5E2DD] text-xs text-[#434B3E] placeholder:text-[#A9AD99] focus:outline-none focus:ring-2 focus:ring-[#CCD5AE]/40 focus:border-[#7B8E7E] transition"
              />
            </div>

            <button
              id="btn-generate-prescription"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>선생님을 위한 따스한 위로를 조제하는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>처방전 발급받기</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            {/* The Prescription Card */}
            <div className="p-6 rounded-[28px] bg-[#FEFAE0] border border-[#CCD5AE] shadow-sm relative">
              <div className="flex items-center justify-between border-b border-[#CCD5AE]/60 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#E9EDC9] text-[#556B2F] flex items-center justify-center font-serif font-bold text-xs">
                    Rx
                  </div>
                  <h3 className="text-sm font-serif font-bold text-[#2D3436] tracking-tight">
                    {prescription.title}
                  </h3>
                </div>
                <span className="text-[10px] text-[#556B2F] bg-[#E9EDC9] px-2.5 py-0.5 rounded-full font-medium border border-[#CCD5AE]">
                  선생님 전용
                </span>
              </div>

              {/* Empathy Note */}
              <p className="text-xs sm:text-[13px] text-[#2D3436] leading-relaxed mb-4 font-serif italic bg-white/70 p-3.5 rounded-2xl border border-[#E5E2DD]">
                "{prescription.empathy}"
              </p>

              {/* Action */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-[#E5E2DD]">
                  <div className="flex items-center gap-1.5 font-bold text-[#556B2F] mb-1">
                    <Heart className="w-3.5 h-3.5 text-[#556B2F]" />
                    <span>오늘의 셀프케어 처방:</span>
                  </div>
                  <p className="text-[#6B705C] pl-5 leading-normal">
                    {prescription.rxAction}
                  </p>
                </div>

                {/* Mantra */}
                <div className="p-3 rounded-2xl bg-white border border-[#E5E2DD]">
                  <div className="flex items-center gap-1.5 font-bold text-[#D4A373] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span>가슴에 품을 한 줄 만트라:</span>
                  </div>
                  <p className="text-[#2D3436] pl-5 italic font-serif leading-normal">
                    "{prescription.mantra}"
                  </p>
                </div>

                {/* Tea */}
                <div className="p-3 rounded-2xl bg-white border border-[#E5E2DD] flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#D4A373] shrink-0" />
                  <span className="text-[#6B705C]">
                    추천 힐링 티: <strong className="text-[#2D3436] font-semibold">{prescription.teaRecommendation}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E2DD]">
              <button
                onClick={() => setPrescription(null)}
                className="px-3.5 py-2.5 rounded-2xl text-xs text-[#A9A29C] hover:text-[#434B3E] hover:bg-[#F1EFEB] transition"
              >
                다시 조제하기
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="btn-copy-prescription"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#E5E2DD] text-[#434B3E] hover:bg-[#F1EFEB] text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#556B2F]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "복사완료" : "처방전 복사"}</span>
                </button>

                {onSendToChat && (
                  <button
                    id="btn-send-prescription-chat"
                    onClick={handleStartChatWithPrescription}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] text-white text-xs font-medium transition shadow-xs"
                  >
                    <MessageSquareHeart className="w-3.5 h-3.5" />
                    <span>상담실에서 나누기</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
