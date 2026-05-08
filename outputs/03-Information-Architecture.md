# 별땅 - 정보 구조 (IA) & 화면 목록

문서 버전: v0.1

## 1. 글로벌 네비게이션

| 위치 | 항목 | 설명 |
|---|---|---|
| Header (좌) | 로고 | 클릭 시 매물 리스트 |
| Header (중앙) | Marketplace / Appraise / Transactions | 주요 섹션 진입 |
| Header (우) | 알림 / 프로필 | 비로그인 시 "로그인/회원가입" |
| Footer | Platform / Resources / Legal | 정적 페이지 모음 |

## 2. 화면 목록 (Screen Inventory)

총 26개 화면. (M) = MVP 필수, (P2) = Phase 2

### 2.1. 공용 (Public)
| ID | 화면 | 경로 | 우선순위 |
|---|---|---|---|
| S-01 | 매물 리스트 (마켓플레이스) | `/` | M |
| S-02 | 매물 상세 | `/properties/[id]` | M |
| S-03 | 회원가입 | `/auth/signup` | M |
| S-04 | 로그인 | `/auth/login` | M |
| S-05 | 비밀번호 재설정 | `/auth/reset` | P2 |
| S-06 | 검색 결과 (필터 적용) | `/search` (or query string) | M |
| S-07 | 정적: 이용약관/개인정보처리방침 | `/legal/*` | M |

### 2.2. 매수자 (Buyer)
| ID | 화면 | 경로 | 우선순위 |
|---|---|---|---|
| S-10 | 마이페이지 (대시보드) | `/me` | M |
| S-11 | 구매한 리뷰 목록 | `/me/reviews` | M |
| S-12 | 리뷰 상세 (열람) | `/me/reviews/[id]` | M |
| S-13 | 매수 의향서 폼 (모달 또는 페이지) | `/properties/[id]/intent` | M |
| S-14 | 의향서 내역 | `/me/intents` | M |
| S-15 | 즐겨찾기 | `/me/favorites` | P2 |

### 2.3. 감정평가사 (Appraiser)
| ID | 화면 | 경로 | 우선순위 |
|---|---|---|---|
| S-20 | 감정사 대시보드 | `/appraiser` | M |
| S-21 | 리뷰 작성 폼 | `/appraiser/reviews/new?propertyId=...` | M |
| S-22 | 발행한 리뷰 목록 | `/appraiser/reviews` | M |
| S-23 | 정산 내역 | `/appraiser/payouts` | M |
| S-24 | 자격 인증 신청 | `/appraiser/verify` | M |

### 2.4. 공인중개사 (Broker)
| ID | 화면 | 경로 | 우선순위 |
|---|---|---|---|
| S-30 | 중개사 대시보드 | `/broker` | M |
| S-31 | 매물 등록 (4-step wizard) | `/broker/properties/new` | M |
| S-32 | 등록한 매물 관리 | `/broker/properties` | M |
| S-33 | 수신 의향서 | `/broker/intents` | M |
| S-34 | 거래 정산 내역 | `/broker/transactions` | M |
| S-35 | 거래 완료 보고 | `/broker/transactions/new?propertyId=...` | M |

### 2.5. 결제/거래
| ID | 화면 | 경로 | 우선순위 |
|---|---|---|---|
| S-40 | 결제 완료 (성공) | `/payments/success` | M |
| S-41 | 결제 실패 | `/payments/fail` | M |
| S-42 | 거래 요약 / 정산 페이지 | `/transactions/[id]` | M |

### 2.6. 관리자 (Admin)
| ID | 화면 | 경로 | 우선순위 |
|---|---|---|---|
| S-50 | 관리자 홈 | `/admin` | M |
| S-51 | 감정사 승인 큐 | `/admin/appraisers` | M |
| S-52 | 거래 검증 큐 | `/admin/transactions` | M |
| S-53 | 신고/분쟁 관리 | `/admin/reports` | P2 |

## 3. 핵심 화면 상세 컴포넌트 분해

### S-01 매물 리스트
- `PageHeader` (제목 + 부제)
- `SearchBar` (지역/건물명 검색 + 필터 드로어 + 검색 버튼)
- `CategoryTabs` (전체/아파트/빌라/단독주택/오피스텔/상가·사무실)
- `PropertyGrid`
  - `PropertyCard` (이미지, 프리미엄 뱃지, 별점, 가격, 위치, 침실, 면적, "감정 N건 가능", 상세보기 링크)
- `LoadMore` 버튼
- `AppraiserCTABanner` (감정사 가입 유도)
- `Footer`

### S-02 매물 상세
- `Breadcrumb`
- `PropertyTitle` (한글명·영문명·위치·뱃지)
- `Gallery` (메인 + 사이드 + "+N장 더보기")
- `Tabs` (상세 정보 / 감정사 리뷰 (N) / 위치 및 주변 시설)
- `SpecCards` (전용면적·침실/욕실·주차·준공연도)
- `Description`
- `ReviewList`
  - `ReviewCard` (감정사 프로필·평점·잠금 상태·열람 비용·해제 버튼)
- (Sidebar)
  - `PriceCard` (매매 가격, 3.3m²당 가격, 취득세 예상)
  - `BrokerCard` (중개사 프로필 + 연락하기)
  - `IntentButton` (매수 의향서 제출)
  - `EscrowBadge` (안심 거래)
  - `Checklist` (현장 답사·등기부·리모델링)

### S-21 리뷰 작성 폼 (감정평가사)
- `TargetPropertyHeader`
- `ValueEstimateSection` (슬라이더 + 정밀 입력 + 신뢰도)
- `MarketOutlookSection` (강세/중립/약세 + 근거 텍스트)
- `EvidenceUpload` (사진/문서, 최대 10건)
- `PriceSetting` (판매가 + 수수료 안내 + 예상 정산액)
- `Disclaimer` (정식 평가서 아님 안내, 발행 후 수정 불가)
- `Actions` (임시 저장 / 발행하기)

### S-42 거래 정산 페이지
- `Header` (정산 완료 ID + 인쇄/PDF 다운로드)
- `KPICards` (총 거래 / 플랫폼 / 중개인 / 감정인)
- `DistributionChart` (도넛: 매매 대금·플랫폼·중개·감정)
- `BreakdownTable` (조건별 수수료 계산)
- `LedgerTable` (정산 항목 상세)
- `PolicyNotice` (T+3 영업일 안내)

## 4. 모바일 vs 데스크톱

- 디자인 PDF에 모바일 별도 디자인이 있는 화면: 매물 리스트, 매물 상세, 리뷰 작성, 결제 완료
- 그 외는 반응형으로 단일 구현 (Tailwind breakpoint: `md:768px`, `lg:1024px`, `xl:1280px`)
- 모바일에서는 매물 상세의 사이드바가 화면 하단 Sticky CTA로 변경 (예: "상담 예약" / "거래 제안하기")

## 5. 디자인 토큰 (디자인 PDF 기준 추출)

| 토큰 | 값 | 용도 |
|---|---|---|
| Color/Primary | `#0A0A0A` (Near-black) | CTA 버튼·강조 |
| Color/Surface | `#FFFFFF` | 카드·배경 |
| Color/Bg | `#F7F7F8` | 페이지 배경 |
| Color/Border | `#E5E7EB` | 카드 테두리 |
| Color/Text | `#0F172A` / `#475569` | 본문 / 보조 |
| Color/Accent-Red | `#DC2626` | 가격 강조·알림 |
| Color/Accent-Green | `#16A34A` | 인증 뱃지·성공 |
| Color/Accent-Blue | `#2563EB` | 안심 거래·정보 |
| Color/Accent-Orange | `#F97316` | 플랫폼 수수료 KPI |
| Radius/Card | `12px` | 카드 |
| Radius/Button | `9999px` (pill) / `8px` | CTA / 일반 |
| Font | Pretendard / Inter | 한글 / 영문 |
| Spacing | 4·8·12·16·24·32·48 | Tailwind 기본 |
