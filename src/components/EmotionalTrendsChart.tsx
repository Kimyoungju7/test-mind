import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Heart,
  Calendar,
  Sparkles,
  ShieldAlert,
  Coffee,
  BookOpenCheck,
  ChevronRight,
  Info,
  Filter,
  CheckCircle2,
  Smile,
  AlertCircle
} from "lucide-react";
import { CounselingSession, CounselorPersona } from "../types";
import { soundFx } from "../utils/audio";

interface EmotionalTrendsChartProps {
  sessions: CounselingSession[];
  onSelectSession?: (session: CounselingSession) => void;
  onRestoreSession?: (session: CounselingSession) => void;
}

interface TrendDataPoint {
  id: string;
  title: string;
  summary?: string;
  persona: CounselorPersona;
  personaLabel: string;
  personaColor: string;
  rawDate: string;
  displayDate: string;
  fullDate: string;
  moodScore: number;
  temperature: number;
  reliefTemperature: number; // estimated post-counseling recovery
  stressLabel: string;
  messageCount: number;
  notes?: string;
  tags: string[];
}

const PERSONA_CONFIG: Record<CounselorPersona, { label: string; color: string; bg: string }> = {
  warm: { label: "토닥이 (온기·경청)", color: "#556B2F", bg: "bg-[#E9EDC9]" },
  parent: { label: "학부모 소통 코칭", color: "#D4A373", bg: "bg-[#FAEDCD]" },
  discipline: { label: "수석교사 멘토 (생활지도)", color: "#7B8E7E", bg: "bg-[#F1EFEB]" },
  burnout: { label: "번아웃·워라밸 코치", color: "#6B705C", bg: "bg-[#FEFAE0]" },
};

const STRESS_TIERS: Record<number, { label: string; desc: string; color: string; badgeBg: string }> = {
  1: { label: "잔잔한 평온", desc: "마음의 여유와 안정을 되찾은 상태", color: "#556B2F", badgeBg: "bg-[#E9EDC9] text-[#556B2F]" },
  2: { label: "가벼운 피로", desc: "일과 후 피로가 조금 쌓인 상태", color: "#7B8E7E", badgeBg: "bg-[#CCD5AE]/40 text-[#434B3E]" },
  3: { label: "답답하고 지침", desc: "감정적 긴장과 스트레스가 지속되는 상태", color: "#D4A373", badgeBg: "bg-[#FAEDCD] text-[#8C5243]" },
  4: { label: "번아웃 경고", desc: "교실과 업무로 지쳐 즉각 쉼이 필요한 상태", color: "#BC6C25", badgeBg: "bg-[#F7EFE9] text-[#BC6C25]" },
  5: { label: "응급 쉼터 필요", desc: "마음의 고열로 전문적 돌봄이 절실한 상태", color: "#C85A5A", badgeBg: "bg-[#FBEAEA] text-[#C85A5A]" },
};

export const EmotionalTrendsChart: React.FC<EmotionalTrendsChartProps> = ({
  sessions,
  onSelectSession,
  onRestoreSession,
}) => {
  const [timeFilter, setTimeFilter] = useState<"all" | "30d" | "7d">("all");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"temperature" | "persona" | "recovery">("temperature");
  const [selectedPoint, setSelectedPoint] = useState<TrendDataPoint | null>(null);

  // 1. Process and sort sessions chronologically (Oldest -> Newest)
  const processedData: TrendDataPoint[] = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const now = Date.now();
    const filtered = sorted.filter((s) => {
      // Time filter
      if (timeFilter === "7d") {
        const diff = now - new Date(s.createdAt).getTime();
        if (diff > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (timeFilter === "30d") {
        const diff = now - new Date(s.createdAt).getTime();
        if (diff > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Persona filter
      if (personaFilter !== "all" && s.persona !== personaFilter) {
        return false;
      }

      return true;
    });

    return filtered.map((s, idx) => {
      const dateObj = new Date(s.createdAt);
      const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      const fullDate = dateObj.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Derive mood score (1 to 5)
      let moodScore = 3;
      if (typeof s.moodScore === "number" && s.moodScore >= 1 && s.moodScore <= 5) {
        moodScore = Math.round(s.moodScore);
      } else {
        // Reasonable fallback based on persona
        if (s.persona === "parent") moodScore = 4;
        else if (s.persona === "discipline") moodScore = 4;
        else if (s.persona === "burnout") moodScore = 3;
        else moodScore = 2;
      }

      // 36.5°C to 40.5°C
      const temperature = Number((35.5 + moodScore * 1.0).toFixed(1));
      // Post counseling cooling effect: usually cools down by 1.0°C to 1.5°C
      const reliefTemperature = Math.max(36.5, Number((temperature - 1.2).toFixed(1)));

      const tier = STRESS_TIERS[moodScore] || STRESS_TIERS[3];
      const cfg = PERSONA_CONFIG[s.persona] || PERSONA_CONFIG.warm;

      return {
        id: s.id,
        title: s.title || `상담 기록 #${idx + 1}`,
        summary: s.summary,
        persona: s.persona,
        personaLabel: cfg.label,
        personaColor: cfg.color,
        rawDate: s.createdAt,
        displayDate,
        fullDate,
        moodScore,
        temperature,
        reliefTemperature,
        stressLabel: tier.label,
        messageCount: s.messages?.length || 0,
        notes: s.notes,
        tags: s.tags || [],
      };
    });
  }, [sessions, timeFilter, personaFilter]);

  // 2. Persona average temperature & counts for BarChart comparison
  const personaAggregates = useMemo(() => {
    const counts: Record<CounselorPersona, { totalTemp: number; count: number }> = {
      warm: { totalTemp: 0, count: 0 },
      parent: { totalTemp: 0, count: 0 },
      discipline: { totalTemp: 0, count: 0 },
      burnout: { totalTemp: 0, count: 0 },
    };

    processedData.forEach((d) => {
      if (counts[d.persona]) {
        counts[d.persona].totalTemp += d.temperature;
        counts[d.persona].count += 1;
      }
    });

    return (Object.keys(PERSONA_CONFIG) as CounselorPersona[]).map((key) => {
      const item = counts[key];
      const avg = item.count > 0 ? Number((item.totalTemp / item.count).toFixed(1)) : 0;
      return {
        key,
        name: PERSONA_CONFIG[key].label.split(" ")[0], // short name
        fullName: PERSONA_CONFIG[key].label,
        avgTemperature: avg,
        sessionCount: item.count,
        color: PERSONA_CONFIG[key].color,
      };
    });
  }, [processedData]);

  // 3. Overall KPI stats
  const kpiStats = useMemo(() => {
    if (processedData.length === 0) {
      return {
        latestTemp: 36.5,
        prevDiff: 0,
        avgTemp: 36.5,
        peakTemp: 36.5,
        peakItem: null,
        recoveryRate: 100,
      };
    }

    const latest = processedData[processedData.length - 1];
    const prev = processedData.length > 1 ? processedData[processedData.length - 2] : null;
    const prevDiff = prev ? Number((latest.temperature - prev.temperature).toFixed(1)) : 0;

    const totalTemp = processedData.reduce((acc, cur) => acc + cur.temperature, 0);
    const avgTemp = Number((totalTemp / processedData.length).toFixed(1));

    let peakItem = processedData[0];
    let calmCount = 0;

    processedData.forEach((d) => {
      if (d.temperature > peakItem.temperature) {
        peakItem = d;
      }
      if (d.temperature <= 37.5) {
        calmCount++;
      }
    });

    const recoveryRate = Math.round((calmCount / processedData.length) * 100);

    return {
      latestTemp: latest.temperature,
      prevDiff,
      avgTemp,
      peakTemp: peakItem.temperature,
      peakItem,
      recoveryRate,
    };
  }, [processedData]);

  // Handle chart node click
  const handlePointClick = (point: TrendDataPoint) => {
    soundFx.playSoftChime();
    setSelectedPoint(point);
    const matched = sessions.find((s) => s.id === point.id);
    if (matched && onSelectSession) {
      onSelectSession(matched);
    }
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TrendDataPoint = payload[0].payload;
      const tier = STRESS_TIERS[data.moodScore] || STRESS_TIERS[3];

      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E5E2DD] shadow-xl text-xs max-w-xs transition animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-[#E5E2DD]/80 pb-2 mb-2">
            <span className="text-[11px] font-medium text-[#6B705C] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#556B2F]" />
              {data.fullDate}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tier.badgeBg}`}>
              {data.temperature}°C · {tier.label}
            </span>
          </div>

          <h4 className="font-serif font-bold text-[#2D3436] mb-1 leading-snug line-clamp-2">
            {data.title}
          </h4>

          <div className="flex items-center gap-1.5 text-[11px] text-[#556B2F] font-semibold mb-2">
            <span>{data.personaLabel}</span>
            <span className="text-[#A9A29C]">·</span>
            <span className="text-[#6B705C] font-normal">대화 {data.messageCount}회</span>
          </div>

          {data.notes && (
            <div className="p-2 rounded-xl bg-[#FDFBF7] border border-[#E5E2DD] text-[11px] text-[#434B3E] italic line-clamp-2 mb-2">
              "{data.notes}"
            </div>
          )}

          {data.tags && data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.tags.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] text-[#6B705C] bg-[#F1EFEB] px-1.5 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 text-[10px] text-[#A9AD99] text-right font-medium">
            클릭하여 상세 기록 확인
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Controls & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-[28px] border border-[#E5E2DD] shadow-2xs">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#F1EFEB]/70 p-1 rounded-2xl">
          <button
            id="btn-view-temperature"
            onClick={() => {
              soundFx.playSoftChime();
              setViewMode("temperature");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              viewMode === "temperature"
                ? "bg-white text-[#556B2F] shadow-2xs"
                : "text-[#6B705C] hover:text-[#2D3436]"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#BC6C25]" />
            <span>마음 체온 추이</span>
          </button>

          <button
            id="btn-view-persona"
            onClick={() => {
              soundFx.playSoftChime();
              setViewMode("persona");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              viewMode === "persona"
                ? "bg-white text-[#556B2F] shadow-2xs"
                : "text-[#6B705C] hover:text-[#2D3436]"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#556B2F]" />
            <span>상담사별 스트레스 비교</span>
          </button>

          <button
            id="btn-view-recovery"
            onClick={() => {
              soundFx.playSoftChime();
              setViewMode("recovery");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              viewMode === "recovery"
                ? "bg-white text-[#556B2F] shadow-2xs"
                : "text-[#6B705C] hover:text-[#2D3436]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>상담 치유 효과</span>
          </button>
        </div>

        {/* Right: Date & Persona Filters */}
        <div className="flex items-center gap-2">
          {/* Time range */}
          <div className="flex items-center gap-1 text-xs">
            {(["all", "30d", "7d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  soundFx.playSoftChime();
                  setTimeFilter(range);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition ${
                  timeFilter === range
                    ? "bg-[#556B2F] text-white"
                    : "text-[#6B705C] hover:bg-[#F1EFEB]"
                }`}
              >
                {range === "all" ? "전체" : range === "30d" ? "최근 30일" : "최근 7일"}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#E5E2DD]" />

          {/* Persona selector */}
          <select
            value={personaFilter}
            onChange={(e) => {
              soundFx.playSoftChime();
              setPersonaFilter(e.target.value);
            }}
            className="text-xs bg-[#FDFBF7] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-[#434B3E] focus:outline-none focus:border-[#7B8E7E]"
          >
            <option value="all">모든 상담사</option>
            <option value="warm">토닥이 (경청)</option>
            <option value="parent">학부모 소통</option>
            <option value="discipline">생활지도</option>
            <option value="burnout">번아웃 코치</option>
          </select>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Latest Temperature */}
        <div className="p-4 rounded-[24px] bg-white border border-[#E5E2DD] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B705C]">
            <span>최근 기록 마음 온도</span>
            <Flame className="w-3.5 h-3.5 text-[#BC6C25]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-[#2D3436]">
              {kpiStats.latestTemp}°C
            </span>
            {kpiStats.prevDiff !== 0 && (
              <span
                className={`text-[11px] font-semibold flex items-center ${
                  kpiStats.prevDiff < 0 ? "text-[#556B2F]" : "text-[#C85A5A]"
                }`}
              >
                {kpiStats.prevDiff < 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3 inline mr-0.5" />
                    {Math.abs(kpiStats.prevDiff)}°C 완화
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3 inline mr-0.5" />
                    {kpiStats.prevDiff}°C 상승
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#A9AD99]">
            {kpiStats.latestTemp <= 37.0
              ? "온화하고 편안한 평온 체온"
              : kpiStats.latestTemp <= 38.5
              ? "경미한 피로 누적 상태"
              : "충분한 휴식과 돌봄 필요"}
          </p>
        </div>

        {/* Average Temperature */}
        <div className="p-4 rounded-[24px] bg-white border border-[#E5E2DD] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B705C]">
            <span>평균 감정 부하 체온</span>
            <Activity className="w-3.5 h-3.5 text-[#556B2F]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#556B2F]">
            {kpiStats.avgTemp}°C
          </div>
          <p className="text-[10px] text-[#A9AD99]">
            기록된 {processedData.length}회 상담 평균 수치
          </p>
        </div>

        {/* Peak Stress Point */}
        <div className="p-4 rounded-[24px] bg-white border border-[#E5E2DD] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B705C]">
            <span>최고 긴장 기록 시점</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#C85A5A]" />
          </div>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-2xl font-serif font-bold text-[#C85A5A]">
              {kpiStats.peakTemp}°C
            </span>
            <span className="text-[11px] text-[#8C5243] font-medium truncate">
              {kpiStats.peakItem ? kpiStats.peakItem.displayDate : "-"}
            </span>
          </div>
          <p className="text-[10px] text-[#A9AD99] truncate">
            {kpiStats.peakItem ? kpiStats.peakItem.title : "기록 없음"}
          </p>
        </div>

        {/* Recovery Rate */}
        <div className="p-4 rounded-[24px] bg-white border border-[#E5E2DD] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B705C]">
            <span>안정 상태 회복률</span>
            <Heart className="w-3.5 h-3.5 text-[#D4A373]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#D4A373]">
            {kpiStats.recoveryRate}%
          </div>
          <p className="text-[10px] text-[#A9AD99]">
            체온 37.5°C 이하 평온 유지 비율
          </p>
        </div>
      </div>

      {/* 3. Main Interactive Recharts Section */}
      <div className="p-5 sm:p-6 rounded-[32px] bg-white border border-[#E5E2DD] shadow-2xs space-y-4">
        {/* Chart Title & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E2DD]/70 pb-3">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#2D3436] flex items-center gap-2">
              <span>
                {viewMode === "temperature"
                  ? "선생님 마음 스트레스 체온 추이 (°C)"
                  : viewMode === "persona"
                  ? "상담사 유형별 평균 스트레스 체온 비교"
                  : "상담 전후 마음 체온 완화 곡선 (치유 효과)"}
              </span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#FEFAE0] text-[#8C5243] border border-[#CCD5AE]">
                Recharts 실시간 데이터
              </span>
            </h3>
            <p className="text-xs text-[#6B705C] mt-0.5">
              {viewMode === "temperature"
                ? "상담 일자에 기록된 선생님의 마음 온도 변화와 회복 흐름입니다. 차트의 포인트를 클릭하면 대화 상세를 볼 수 있습니다."
                : viewMode === "persona"
                ? "학부모 민원, 생활지도, 행정업무 등 어떤 교직 상황에서 마음의 온도가 가장 높았는지 한눈에 비교합니다."
                : "상담을 시작할 당시의 체온(갈색 선)과 경청 및 조언 후 마음을 추스른 예상 회복 체온(녹색 선)의 비교입니다."}
            </p>
          </div>

          {/* Reference Legend */}
          <div className="flex items-center gap-3 text-[11px] text-[#6B705C] shrink-0">
            {viewMode === "temperature" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#556B2F]" />
                  <span>정상 평온 (36.5°C)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#BC6C25]" />
                  <span>번아웃 주의 (39.0°C)</span>
                </div>
              </>
            )}
            {viewMode === "recovery" && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#BC6C25]" />
                  <span>상담 전 마음 체온</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#556B2F]" />
                  <span>상담 후 회복 체온</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="w-full h-72 sm:h-80 min-w-0">
          {processedData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-[#A9AD99]">
              <AlertCircle className="w-8 h-8 text-[#CCD5AE] mb-2" />
              <p className="text-xs font-medium text-[#434B3E]">
                선택한 필터 조건에 해당하는 상담 기록이 없습니다.
              </p>
              <p className="text-[11px] mt-1">
                기간이나 상담사 필터를 변경하시거나 새 상담을 진행 후 저장해 보세요.
              </p>
            </div>
          ) : viewMode === "temperature" ? (
            /* Mode 1: AreaChart (Time Series Temperature) */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={processedData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    handlePointClick(e.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="warmSageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#556B2F" stopOpacity={0.4} />
                    <stop offset="60%" stopColor="#CCD5AE" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FDFBF7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: "#E5E2DD" }}
                  tick={{ fill: "#6B705C", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  domain={[36.0, 41.0]}
                  ticks={[36.5, 37.5, 38.5, 39.5, 40.5]}
                  tickFormatter={(val) => `${val}°C`}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E2DD" }}
                  tick={{ fill: "#6B705C", fontSize: 11 }}
                  dx={-4}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={36.5}
                  stroke="#556B2F"
                  strokeDasharray="4 4"
                  label={{
                    value: "평온 기준 (36.5°C)",
                    fill: "#556B2F",
                    fontSize: 10,
                    position: "insideBottomRight",
                  }}
                />
                <ReferenceLine
                  y={39.0}
                  stroke="#C85A5A"
                  strokeDasharray="4 4"
                  label={{
                    value: "번아웃 주의 (39.0°C)",
                    fill: "#C85A5A",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="마음 온도"
                  stroke="#556B2F"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#warmSageGradient)"
                  activeDot={{
                    r: 6,
                    fill: "#556B2F",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                    className: "cursor-pointer",
                  }}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color =
                      payload.moodScore >= 5
                        ? "#C85A5A"
                        : payload.moodScore >= 4
                        ? "#BC6C25"
                        : payload.moodScore >= 3
                        ? "#D4A373"
                        : "#556B2F";
                    const isSelected = selectedPoint?.id === payload.id;

                    return (
                      <circle
                        key={payload.id}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 6 : 4.5}
                        fill={color}
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="cursor-pointer transition-all hover:scale-125"
                        onClick={() => handlePointClick(payload)}
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : viewMode === "persona" ? (
            /* Mode 2: BarChart (Persona comparison) */
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={personaAggregates}
                margin={{ top: 20, right: 20, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#E5E2DD" }}
                  tick={{ fill: "#434B3E", fontSize: 11, fontWeight: 500 }}
                  dy={6}
                />
                <YAxis
                  domain={[35.0, 41.0]}
                  ticks={[36.0, 37.0, 38.0, 39.0, 40.0]}
                  tickFormatter={(val) => `${val}°C`}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E2DD" }}
                  tick={{ fill: "#6B705C", fontSize: 11 }}
                  dx={-4}
                />
                <Tooltip
                  cursor={{ fill: "#F1EFEB", opacity: 0.5 }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val}°C (상담 ${item.payload.sessionCount}회)`,
                    item.payload.fullName,
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    border: "1px solid #E5E2DD",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine
                  y={36.5}
                  stroke="#556B2F"
                  strokeDasharray="3 3"
                  label={{ value: "기본 체온 (36.5°C)", fill: "#556B2F", fontSize: 10 }}
                />
                <Bar
                  dataKey="avgTemperature"
                  name="평균 스트레스 체온"
                  radius={[12, 12, 0, 0]}
                  maxBarSize={54}
                >
                  {personaAggregates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* Mode 3: Dual Line Recovery Comparison */
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    handlePointClick(e.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={{ stroke: "#E5E2DD" }}
                  tick={{ fill: "#6B705C", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  domain={[36.0, 41.0]}
                  ticks={[36.5, 37.5, 38.5, 39.5, 40.5]}
                  tickFormatter={(val) => `${val}°C`}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E2DD" }}
                  tick={{ fill: "#6B705C", fontSize: 11 }}
                  dx={-4}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={36.5}
                  stroke="#556B2F"
                  strokeDasharray="4 4"
                  label={{ value: "안정 목표선 (36.5°C)", fill: "#556B2F", fontSize: 10 }}
                />
                {/* Pre-counseling temperature */}
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="상담 전 체온"
                  stroke="#BC6C25"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: "#BC6C25" }}
                />
                {/* Post-counseling relief temperature */}
                <Line
                  type="monotone"
                  dataKey="reliefTemperature"
                  name="상담 후 회복 체온"
                  stroke="#556B2F"
                  strokeWidth={2.5}
                  dot={{ r: 4.5, fill: "#556B2F", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Selected Data Point Highlight Card */}
        {selectedPoint && (
          <div className="p-4 rounded-2xl bg-[#FEFAE0]/70 border border-[#CCD5AE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2D3436]">
                  선택된 기록: {selectedPoint.displayDate} ({selectedPoint.personaLabel})
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#556B2F] border border-[#CCD5AE]">
                  {selectedPoint.temperature}°C · {selectedPoint.stressLabel}
                </span>
              </div>
              <p className="text-xs text-[#434B3E] font-serif font-medium">
                "{selectedPoint.title}"
              </p>
              {selectedPoint.notes && (
                <p className="text-[11px] text-[#6B705C] italic">
                  회고 메모: {selectedPoint.notes}
                </p>
              )}
            </div>

            {onRestoreSession && (
              <button
                onClick={() => {
                  const s = sessions.find((item) => item.id === selectedPoint.id);
                  if (s) onRestoreSession(s);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#556B2F] text-white text-xs font-semibold hover:bg-[#435424] transition shadow-2xs"
              >
                <span>이 상담 대화 이어가기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. AI Counselor Clinical Diagnostic & Trend Insights */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-white to-[#FDFBF7] border border-[#E5E2DD] shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E9EDC9] text-[#556B2F] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-serif font-bold text-[#2D3436]">
              상담사 '토닥이'의 마음 회복 리포트
            </h4>
            <p className="text-[10px] text-[#A9A29C]">
              누적된 시계열 감정 데이터를 바탕으로 한 맞춤형 치유 조언
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#434B3E] leading-relaxed pl-1">
          {kpiStats.peakTemp >= 40.0 ? (
            <p>
              <strong className="text-[#C85A5A]">고열 경계 완화 관찰:</strong>{" "}
              {kpiStats.peakItem?.displayDate}경 학부모 민원 및 교실 돌발 상황으로 인해 마음 온도가{" "}
              <strong>{kpiStats.peakTemp}°C</strong>까지 치솟았으나, 즉시 상담실을 찾아 마음의 짐을
              털어놓으면서 현재 <strong>{kpiStats.latestTemp}°C</strong>로 점진적인 안정을 되찾고 계십니다.
            </p>
          ) : (
            <p>
              <strong className="text-[#556B2F]">안정적 정서 방어력 유지:</strong>{" "}
              선생님께서는 일과 중 발생하는 스트레스를 마음에 오래 묵혀두지 않고 주기적으로 상담과 회고를
              통해 비워내고 계십니다. 평균 체온 <strong>{kpiStats.avgTemp}°C</strong>로 안정적인 치유 흐름을 보여주고 있습니다.
            </p>
          )}

          <div className="p-3 rounded-2xl bg-[#F1EFEB]/70 border border-[#E5E2DD] flex items-start gap-2.5 mt-2">
            <Info className="w-4 h-4 text-[#556B2F] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#6B705C] leading-normal">
              <strong>선생님을 위한 추천 셀프케어:</strong> 감정 온도가 39.0°C 이상으로 오르는 날에는
              교문을 나설 때 학교 메신저를 무음으로 설정하고, '4-7-8 안도 호흡'과 함께 따뜻한 차 한 잔으로
              나만의 저녁 경계를 보호해 주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
