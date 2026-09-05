import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Volume2, 
  Bot, 
  User, 
  Heart, 
  ShieldAlert, 
  BookOpenCheck, 
  Coffee, 
  Trash2,
  Wind,
  Download,
  Save,
  BookOpen
} from "lucide-react";
import { ChatMessage, CounselorPersona, CounselingSession } from "../types";
import { PERSONAS } from "../data/counselingData";
import { soundFx } from "../utils/audio";
import { SaveCounselingModal } from "./SaveCounselingModal";

interface ChatSectionProps {
  onOpenBreathing: () => void;
  onOpenArchive?: () => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  restoredSession?: CounselingSession | null;
  onClearRestoredSession?: () => void;
  stressScore?: number;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  onOpenBreathing,
  onOpenArchive,
  initialPrompt,
  onClearInitialPrompt,
  restoredSession,
  onClearRestoredSession,
  stressScore = 3,
}) => {
  const [activePersona, setActivePersona] = useState<CounselorPersona>("warm");
  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "msg-welcome",
        role: "assistant",
        content:
          "선생님, 오늘도 교실이라는 거친 파도 속에서 온 힘을 다해 자리를 지켜내시느라 진심으로 고생 많으셨습니다.\n\n학부모 민원, 생활지도의 어려움, 쏟아지는 업무, 혹은 마음 한구석의 자책감까지... 누구에게도 털어놓지 못했던 이야기를 이곳에 편히 기대어 내려놓아 주세요. 제가 온전히 곁에서 들어드릴게요.",
        timestamp: "방금 전",
        persona: "warm",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentPersonaInfo = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle incoming external prompt (e.g. from stress modal or prescription modal)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Handle restored session from backend archive
  useEffect(() => {
    if (restoredSession) {
      setActivePersona(restoredSession.persona);
      setMessages(restoredSession.messages);
      soundFx.playSingingBowl();
      if (onClearRestoredSession) onClearRestoredSession();
    }
  }, [restoredSession]);

  const handlePersonaChange = (personaId: CounselorPersona) => {
    if (personaId === activePersona) return;
    setActivePersona(personaId);
    soundFx.playSoftChime();

    const newPersona = PERSONAS.find((p) => p.id === personaId);
    if (newPersona) {
      const greetingMsg: ChatMessage = {
        id: `greeting-${Date.now()}`,
        role: "assistant",
        content: newPersona.greeting,
        timestamp: "방금 전",
        persona: personaId,
      };
      setMessages((prev) => [...prev, greetingMsg]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    soundFx.playSoftChime();

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Stream with SSE
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          persona: activePersona,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        throw new Error("상담 응답에 문제가 발생했습니다.");
      }

      const assistantMsgId = `assistant-${Date.now()}`;
      // Add empty assistant message to update streaming chunks into
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
          persona: activePersona,
        },
      ]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
                    )
                  );
                }
              } catch {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
      soundFx.playSingingBowl();
    } catch {
      // Fallback via standard POST
      try {
        const fallbackRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            persona: activePersona,
            model: selectedModel,
          }),
        });
        const data = await fallbackRes.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply || "선생님, 지금 마음에 머물던 이야기를 들려주셔서 감사해요.",
            timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
            persona: activePersona,
          },
        ]);
        soundFx.playSingingBowl();
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "선생님, 잠시 네트워크 연결이 원활하지 않습니다. 하지만 선생님의 마음은 온전히 닿았습니다. 잠시 후 다시 편하게 말씀해 주세요.",
            timestamp: "알림",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ko-KR";
    utterance.rate = 0.92; // slightly calmer & warmer rate
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearChat = () => {
    if (window.confirm("지금까지 나눈 상담 대화 내용을 지우고 새로 시작하시겠습니까?")) {
      setMessages([
        {
          id: `welcome-new-${Date.now()}`,
          role: "assistant",
          content: `${currentPersonaInfo.title}입니다. 선생님, 새로운 마음으로 편안히 이야기 나누어요. 무엇이든 털어놓으셔도 안전합니다.`,
          timestamp: "방금 전",
          persona: activePersona,
        },
      ]);
      soundFx.playSoftChime();
    }
  };

  const handleDownloadTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.role === "user" ? "선생님" : "상담사 토닥이"} - ${m.timestamp}]\n${m.content}\n`)
      .join("\n----------------------------------------\n\n");
    
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `교사_마음상담_대화기록_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPersonaIcon = (id: CounselorPersona) => {
    switch (id) {
      case "warm":
        return <Heart className="w-4 h-4 text-[#556B2F]" />;
      case "parent":
        return <ShieldAlert className="w-4 h-4 text-[#D4A373]" />;
      case "discipline":
        return <BookOpenCheck className="w-4 h-4 text-[#7B8E7E]" />;
      case "burnout":
        return <Coffee className="w-4 h-4 text-[#6B705C]" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] bg-white rounded-[32px] border border-[#E5E2DD] shadow-sm overflow-hidden">
      {/* Persona Selection Header */}
      <div className="p-3.5 sm:p-4 bg-[#F1EFEB] border-b border-[#E5E2DD] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Persona Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {PERSONAS.map((p) => {
            const isSelected = activePersona === p.id;
            return (
              <button
                key={p.id}
                id={`tab-persona-${p.id}`}
                onClick={() => handlePersonaChange(p.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-[#E9EDC9] border-[#CCD5AE] text-[#556B2F] shadow-xs ring-2 ring-[#CCD5AE]/40"
                    : "bg-white/80 border-[#E5E2DD] text-[#6B705C] hover:bg-white"
                }`}
              >
                {getPersonaIcon(p.id)}
                <span>{p.title}</span>
                <span className="text-[10px] font-normal opacity-80 hidden sm:inline">
                  {p.subtitle.split("&")[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Gemini Model & Chat Action Controls */}
        <div className="flex items-center justify-end gap-2 text-xs">
          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-[#E5E2DD] text-[#6B705C]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
            <span className="text-[11px] font-medium text-[#A9A29C] hidden sm:inline">모델:</span>
            <select
              id="select-gemini-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent font-semibold text-[#434B3E] focus:outline-none cursor-pointer text-[11px]"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (기본 추천)</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (안정적 심화)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (초고속)</option>
            </select>
          </div>

          {/* Save to Server Button */}
          <button
            id="btn-save-to-server"
            onClick={() => {
              soundFx.playSoftChime();
              setIsSaveModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] text-white font-medium transition shadow-2xs"
            title="현재 상담 내용을 백엔드 서버에 저장"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">서버에 저장</span>
          </button>

          {/* Open Archive Button */}
          {onOpenArchive && (
            <button
              id="btn-open-archive-chat"
              onClick={() => {
                soundFx.playSoftChime();
                onOpenArchive();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-[#F1EFEB] border border-[#E5E2DD] text-[#434B3E] font-medium transition shadow-2xs"
              title="상담 기록 보관소 열기"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#556B2F]" />
              <span className="hidden sm:inline">상담 보관함</span>
            </button>
          )}

          {/* Transcript Download */}
          <button
            id="btn-download-chat"
            onClick={handleDownloadTranscript}
            className="p-2 rounded-2xl text-[#6B705C] hover:text-[#2D3436] hover:bg-white border border-[#E5E2DD] transition"
            title="상담 대화 텍스트 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear Chat */}
          <button
            id="btn-clear-chat"
            onClick={handleClearChat}
            className="p-2 rounded-2xl text-[#A9AD99] hover:text-[#8C5243] hover:bg-[#F7EFE9] border border-[#E5E2DD] transition"
            title="대화 초기화"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FDFBF7]/60">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
                  isUser
                    ? "bg-[#556B2F] text-white"
                    : "bg-[#E9EDC9] border border-[#CCD5AE] text-[#556B2F]"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div className={`space-y-1.5 ${isUser ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-medium text-[#7B8E7E]">
                    {isUser ? "선생님" : "마음상담사 숲결"}
                  </span>
                  <span className="text-[10px] text-[#A9AD99]">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-2xs whitespace-pre-wrap break-words ${
                    isUser
                      ? "bg-[#556B2F] text-[#FEFAE0] rounded-tr-xs"
                      : "bg-white text-[#434B3E] border border-[#E5E2DD] rounded-tl-xs font-sans"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Assistant Message Extra Controls */}
                {!isUser && msg.content && (
                  <div className="flex items-center gap-1.5 pt-0.5 px-1">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] text-[#A9AD99] hover:text-[#556B2F] hover:bg-[#E9EDC9]/40 transition"
                      title="메시지 복사"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-[#556B2F]" />
                          <span className="text-[#556B2F] font-semibold">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] transition ${
                        speakingId === msg.id
                          ? "bg-[#E9EDC9] text-[#556B2F] font-medium"
                          : "text-[#A9AD99] hover:text-[#556B2F] hover:bg-[#E9EDC9]/40"
                      }`}
                      title="음성으로 따뜻하게 듣기"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{speakingId === msg.id ? "낭독 중지" : "따뜻한 음성"}</span>
                    </button>

                    <button
                      onClick={onOpenBreathing}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] text-[#556B2F] hover:bg-[#E9EDC9]/50 transition"
                      title="가슴이 답답할 때 호흡 훈련"
                    >
                      <Wind className="w-3 h-3" />
                      <span>숨 가다듬기</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Pulsing Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto items-center animate-pulse">
            <div className="w-9 h-9 rounded-full bg-[#E9EDC9] border border-[#CCD5AE] text-[#556B2F] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-[#556B2F]" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E2DD] text-xs text-[#6B705C] rounded-tl-xs shadow-2xs">
              선생님의 마음에 귀 기울이며 따뜻한 숲의 위로를 고르고 있습니다...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestion Chips */}
      <div className="px-4 py-2.5 bg-[#F1EFEB] border-t border-[#E5E2DD] overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] text-[#6B705C] whitespace-nowrap font-medium">추천 이야기:</span>
        {currentPersonaInfo.promptExamples.map((example, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(example)}
            disabled={isLoading}
            className="text-[11px] bg-white hover:bg-[#E9EDC9] hover:border-[#CCD5AE] text-[#434B3E] px-3.5 py-1.5 rounded-2xl border border-[#E5E2DD] whitespace-nowrap transition shadow-2xs shrink-0"
          >
            "{example}"
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3.5 sm:p-4 bg-white border-t border-[#E5E2DD]">
        <div className="flex items-end gap-2 bg-[#FDFBF7] border border-[#E5E2DD] rounded-2xl p-2.5 focus-within:border-[#7B8E7E] focus-within:ring-2 focus-within:ring-[#CCD5AE]/40 transition">
          <textarea
            ref={textareaRef}
            id="input-counseling-message"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="선생님의 마음을 짓누르는 고민, 오늘 교실에서 있었던 일들을 편히 적어주세요. (Enter 전송 / Shift+Enter 줄바꿈)"
            className="flex-1 bg-transparent p-2 text-xs sm:text-sm text-[#434B3E] placeholder:text-[#A9AD99] focus:outline-none resize-none max-h-36"
          />

          <button
            id="btn-send-message"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-[#556B2F] hover:bg-[#435425] disabled:opacity-40 text-white font-medium shadow-xs transition shrink-0"
            title="상담 메시지 보내기"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#A9AD99] px-1 pt-2">
          <span>모든 상담 내용은 외부로 유출되지 않으며 안전하게 보호됩니다.</span>
          <span>Shift+Enter 줄바꿈</span>
        </div>
      </div>

      {/* Save Counseling Modal */}
      {isSaveModalOpen && (
        <SaveCounselingModal
          messages={messages}
          persona={activePersona}
          moodScore={stressScore}
          onClose={() => setIsSaveModalOpen(false)}
          onSaved={() => {
            // keep modal feedback open until user closes or jumps to archive
          }}
          onOpenArchive={() => {
            setIsSaveModalOpen(false);
            if (onOpenArchive) onOpenArchive();
          }}
        />
      )}
    </div>
  );
};
