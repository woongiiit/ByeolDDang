# 별땅 - 개발 로드맵

문서 버전: v0.1

## 1. 마일스톤 개요

| 단계 | 기간 | 목표 |
|---|---|---|
| **M0 — 기반 구축** | Week 0~1 | 모노레포 셋업, 도커, 로컬 DB, 인증 골격 |
| **M1 — 매물 코어** | Week 2~3 | 매물 CRUD + 리스트/상세 화면 |
| **M2 — 리뷰 코어** | Week 4~5 | 리뷰 작성·발행, 잠금 UI, 평가사 승인 |
| **M3 — 결제·정산** | Week 6~7 | 토스 결제, 리뷰 잠금 해제, 정산 ledger |
| **M4 — 거래 흐름** | Week 8 | 매수 의향서, 거래 보고·검증 |
| **M5 — 폴리시 & QA** | Week 9 | E2E 테스트, 보안 감사, 성능 튜닝 |
| **M6 — 베타 런칭** | Week 10 | 클로즈드 베타 (감정사 5명, 중개사 3명, 매물 20건) |

총 10주 = **약 2.5개월** (1인 풀스택 기준 빠듯, 2~3인 팀 권장)

## 2. 단계별 상세

### M0 — 기반 구축 (Week 0~1)

**산출물**:
- [ ] `workspace/` 모노레포 초기화
- [ ] `docker-compose.yml` (postgres + redis + minio)
- [ ] FastAPI 헬로월드 + Alembic 초기화
- [ ] Next.js + Tailwind + shadcn 초기화
- [ ] GitHub Actions: lint + test 워크플로
- [ ] `.env.example` 양쪽 작성
- [ ] README 작성 (실행/디버그 가이드)

**기능**:
- [ ] `/auth/signup`, `/auth/login`, `/auth/refresh`, `/me`
- [ ] 프론트: 로그인/회원가입 페이지 (S-03, S-04)
- [ ] 미들웨어 기반 보호 라우트

**완료 기준**: 회원가입한 사용자가 로그인하고 `/me` 호출이 성공.

---

### M1 — 매물 코어 (Week 2~3)

**기능**:
- [ ] DB: `users`, `user_roles`, `broker_profiles`, `properties`, `property_images`
- [ ] API: `POST/GET/PATCH/DELETE /properties`, `POST /properties/{id}/images`
- [ ] API: `GET /properties` 검색 (q, category, region, price_min/max, sort, page)
- [ ] 프론트: 매물 리스트 (S-01) — 디자인 PDF의 카드 레이아웃 재현
- [ ] 프론트: 매물 상세 (S-02) — 갤러리, 사양 카드, 사이드바
- [ ] 프론트: 중개사 — 매물 등록 폼 (S-31, 4-step)

**완료 기준**: 시드 데이터로 매물 6개를 리스트에 보여주고, 상세에서 사진/사양/중개사 정보가 노출됨.

---

### M2 — 리뷰 코어 (Week 4~5)

**기능**:
- [ ] DB: `appraiser_profiles`, `reviews`
- [ ] API: 평가사 등록·승인 (`POST /me/appraiser-profile`, `POST /admin/appraisers/{id}/approve`)
- [ ] API: `POST /reviews`, `GET /properties/{id}/reviews`
- [ ] 잠금 마스킹 로직 (구매 전: 추정가/근거/증거 마스킹, 작성자/평점/가격만 노출)
- [ ] 프론트: 평가사 - 리뷰 작성 폼 (S-21, 디자인 PDF 그대로)
- [ ] 프론트: 매물 상세에 "감정사 리뷰" 탭 + ReviewCard (잠금 상태)
- [ ] 프론트: 관리자 - 평가사 승인 큐 (S-51)

**완료 기준**: 승인된 평가사가 리뷰를 발행하면 매물 상세에 잠긴 리뷰 카드가 노출됨.

---

### M3 — 결제·정산 (Week 6~7)

**기능**:
- [ ] DB: `payments`, `review_purchases`, `payouts`
- [ ] 토스페이먼츠 연동 (테스트 가맹점)
- [ ] API: `POST /reviews/{id}/purchase` (토스 confirm + 트랜잭션)
- [ ] API: `POST /payments/webhooks/toss` (서명 검증)
- [ ] API: `GET /me/reviews`, `GET /me/payouts`, `GET /appraiser/payouts`
- [ ] 프론트: 결제 모달 (PaymentWidget) + 성공/실패 페이지 (S-40/S-41)
- [ ] 프론트: 결제 완료 (모바일 S-40 디자인 재현)
- [ ] 프론트: 마이페이지 - 구매한 리뷰 / 정산 내역

**완료 기준**: 매수자가 결제하면 리뷰가 즉시 잠금 해제되고 평가사 정산 내역에 row 생성됨.

---

### M4 — 거래 흐름 (Week 8)

**기능**:
- [ ] DB: `purchase_intents`, `transactions`
- [ ] API: 매수 의향서 CRUD (Buyer/Broker 역할별)
- [ ] API: 거래 보고·검증·정산 (`POST /properties/{id}/transactions`, `POST /admin/transactions/{id}/verify`)
- [ ] 정산 자동 계산 서비스 (수수료율 기반)
- [ ] 프론트: 매수 의향서 폼·내역 (S-13, S-14, S-33)
- [ ] 프론트: 거래 정산 페이지 (S-42, 디자인 PDF의 KPI/도넛/Ledger)
- [ ] 프론트: 중개사 - 거래 완료 보고 (S-35)
- [ ] 프론트: 관리자 - 거래 검증 큐 (S-52)

**완료 기준**: 거래 완료 → 검증 → 정산 페이지에서 4개 KPI + 도넛 + Ledger 정상 노출.

---

### M5 — 폴리시 & QA (Week 9)

**기능**:
- [ ] 알림 시스템 (`notifications` + 마이페이지 알림 드로어)
- [ ] Disclaimer 컴포넌트 일관 적용 (리뷰·매물 상세)
- [ ] 환불 정책 코드화 (열람 전 자동 환불 가능)
- [ ] Rate limit (로그인·결제)
- [ ] 모바일 반응형 QA
- [ ] Playwright E2E 5종:
  - 회원가입 → 로그인 → 매물 검색 → 리뷰 결제 → 의향서 제출
  - 평가사 승인 → 리뷰 발행 → 결제 발생 시 정산 row 확인
  - 중개사 매물 등록 → 거래 보고 → 관리자 검증 → 정산 페이지
  - 환불 정책 (열람 전 환불) 동작
  - 권한 분기 (Buyer가 /broker 접근 시 403)
- [ ] Sentry 연동
- [ ] Lighthouse 성능 점수 80+ 목표 (매물 리스트)

---

### M6 — 베타 런칭 (Week 10)

- [ ] 클로즈드 베타 사용자 모집 (감정사 5, 중개사 3)
- [ ] 시드 매물 20건 + 시드 리뷰 50건
- [ ] 운영 가이드 (운영자용 FAQ + 분쟁 대응)
- [ ] 이용약관·개인정보처리방침 법무 검토
- [ ] 결제 실거래 가맹점 신청·승인
- [ ] 도메인 + SSL + 모니터링 알림 채널
- [ ] 출시 KPI 트래킹 대시보드 (간단 Metabase 또는 Mixpanel)

## 3. Definition of Done (모든 단계 공통)

- [ ] 기능 단위 PR + 1명 이상 리뷰
- [ ] 단위 테스트 추가 (서비스 레이어 70%+)
- [ ] OpenAPI 문서 자동 업데이트 확인
- [ ] 프론트: Storybook 또는 라우트 레벨 미리보기
- [ ] CHANGELOG.md 업데이트

## 4. 리스크 & 완화

| 리스크 | 영향 | 완화책 |
|---|---|---|
| 감정평가법 해석 분쟁 | 서비스 중단 가능 | 법무 자문 선행, Disclaimer 구조 검증 |
| 토스 가맹점 승인 지연 | 결제 출시 지연 | 신청은 M0에 미리 |
| 감정사 공급 부족 | 콘텐츠 부족 → 매수자 이탈 | 베타 단계에서 시드 리뷰 자체 제작 + 협회 파트너십 추진 |
| 매물 신뢰도 (호가 부풀림) | 플랫폼 신뢰도 ↓ | 등기부등본 검증 체크리스트 의무, 거래가 공개 |
| 1인 풀스택 시 일정 지연 | 출시 지연 | 우선순위(M-Must / S-Should) 명확, 인하우스 디자이너 제외 — Tailwind+shadcn으로 속도 ↑ |

## 5. 다음 단계 (Phase 2 백로그 후보)

- 리뷰 평판 시스템 (별점·신고)
- 1:1 채팅 (중개인 ↔ 매수자, Pusher 또는 Socket.IO)
- 즐겨찾기·매물 비교
- 모바일 앱 (React Native / Flutter)
- 매물 추천 (협업 필터링 → ML)
- 자동 시세 분석 리포트 (AI 보조)
- 상가·빌딩·토지 카테고리 확장
- 영문 i18n (해외 투자자 대상)
