const PYEONG_PER_M2 = 1 / 3.305785;

export const TOKEN_TO_KRW = 100;

export function formatKRW(value: number): string {
  if (value === null || value === undefined) return "-";
  return `₩${value.toLocaleString("ko-KR")}`;
}

/** 서비스 내 재화 표시 단위 (코인). 코드명은 여전히 token/BYT. */
export function formatTokens(tokens: number): string {
  return `${tokens.toLocaleString("ko-KR")}코인`;
}

export function tokensToKRW(tokens: number): number {
  return tokens * TOKEN_TO_KRW;
}

export function formatTokenWithKRW(tokens: number): string {
  return `${formatTokens(tokens)} (${formatKRW(tokensToKRW(tokens))})`;
}

export function formatKRWShort(value: number): string {
  if (value >= 1_0000_0000) {
    const eok = value / 1_0000_0000;
    if (Number.isInteger(eok)) return `${eok}억원`;
    return `${eok.toFixed(2)}억원`;
  }
  if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString("ko-KR")}만원`;
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

export function m2ToPyeong(m2: number): number {
  return Math.round(m2 * PYEONG_PER_M2);
}

export function formatArea(m2: number): string {
  return `${m2}m² (${m2ToPyeong(m2)}평)`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  apartment: "아파트",
  villa: "빌라",
  detached: "단독주택",
  officetel: "오피스텔",
  commercial: "상가·사무실",
  land: "토지",
};

export const OUTLOOK_LABELS: Record<string, { label: string; tone: string }> = {
  bullish: { label: "강세", tone: "text-accent-green" },
  neutral: { label: "보합", tone: "text-text-muted" },
  bearish: { label: "약세", tone: "text-accent-red" },
};
