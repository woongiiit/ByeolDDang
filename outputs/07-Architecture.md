# 별땅 - 시스템 아키텍처 & 폴더 구조

문서 버전: v0.1

## 1. 시스템 컨텍스트

```
                   ┌─────────────────┐
                   │   사용자 브라우저  │
                   └────────┬────────┘
                            │ HTTPS
                  ┌─────────▼─────────┐
                  │  Next.js (Vercel) │  ← SSR/ISR + Image Optim
                  └─────┬───┬─────────┘
                        │   │
              REST/JSON │   │ S3 Direct Upload (presigned)
                        │   │
                  ┌─────▼───▼─────────┐                ┌─────────────┐
                  │ FastAPI (Python)  │ ── presign ──▶ │   AWS S3    │
                  │  + Uvicorn        │                └─────────────┘
                  └──┬───────┬──────┬─┘
                     │       │      │
                     │       │      └──── PG (토스) ──▶ 토스 결제 서버
                     │       │
            ┌────────▼─┐  ┌──▼────────┐
            │ Postgres │  │   Redis   │
            └──────────┘  └───────────┘
```

## 2. 레이어 아키텍처 (백엔드)

```
HTTP Layer       (FastAPI Routers)
  │  Pydantic schemas validate request
  ▼
Service Layer    (Business logic, transaction boundaries)
  │  Domain rules, fee calc, permission checks
  ▼
Repository Layer (SQLAlchemy + raw SQL when needed)
  │
  ▼
Persistence      (Postgres, Redis, S3 via boto3)
```

원칙:
- Router는 **얇게**, 비즈니스 로직은 Service에
- Service는 **트랜잭션 경계**를 담당 (예: 리뷰 결제 = payment row + review_purchase row + payout row를 한 트랜잭션)
- Repository는 **쿼리 캡슐화**, 테스트 시 모킹 포인트
- 외부 호출(토스, S3, SES)은 **별도 클라이언트 모듈**로 격리

## 3. 프론트엔드 아키텍처

```
app/                       ← Next.js App Router (페이지 = 서버 컴포넌트 default)
  (public)/                ← 비로그인 영역
  (auth)/                  ← 인증 후 영역 (middleware로 보호)
  api/                     ← BFF 엔드포인트 (필요 시)

features/                  ← 도메인별 모듈 (Vertical Slicing)
  properties/
    components/            ← PropertyCard, Gallery, ...
    hooks/                 ← useProperty, usePropertyList
    api.ts                 ← TanStack Query에 묶인 API 함수
    schema.ts              ← zod 스키마

  reviews/                 ← 동일 구조
  intents/
  payments/
  auth/
  appraiser/
  broker/
  admin/

components/ui/             ← shadcn/ui 컴포넌트 (Button, Card, Dialog, Tabs, ...)
lib/                       ← apiClient (axios), utils, formatters (₩, 평수)
hooks/                     ← 공용 훅 (useUser, useToast)
stores/                    ← zustand (UI 상태 한정)
styles/                    ← globals.css, tailwind.css
```

원칙:
- **Server Component를 기본**, 인터랙션 필요한 곳만 `"use client"`
- 데이터 패칭: 서버 컴포넌트에선 직접 fetch, 클라이언트에선 TanStack Query
- 폼: react-hook-form + zod 스키마 (백엔드 스키마와 1:1 매칭)
- 디자인 토큰: `tailwind.config.ts` colors / borderRadius / fontFamily에 명시

## 4. 폴더 구조 (전체)

```
ByeolDDang/
├─ outputs/                      ← 기획·설계 산출물 (현재 폴더)
├─ reference/
│  ├─ Design/                    ← Visily PDF
│  └─ Proposal/                  ← 기획안 PDF
└─ workspace/
   ├─ backend/
   │  ├─ app/
   │  │  ├─ main.py              ← FastAPI 앱
   │  │  ├─ core/
   │  │  │  ├─ config.py         ← Pydantic Settings
   │  │  │  ├─ db.py             ← SQLAlchemy engine/session
   │  │  │  ├─ security.py       ← JWT, bcrypt
   │  │  │  └─ exceptions.py
   │  │  ├─ models/              ← SQLAlchemy 모델
   │  │  │  ├─ user.py
   │  │  │  ├─ property.py
   │  │  │  ├─ review.py
   │  │  │  ├─ payment.py
   │  │  │  ├─ transaction.py
   │  │  │  └─ ...
   │  │  ├─ schemas/             ← Pydantic 요청/응답 스키마
   │  │  │  ├─ user.py
   │  │  │  ├─ property.py
   │  │  │  └─ ...
   │  │  ├─ repositories/        ← DB 접근 (선택)
   │  │  ├─ services/            ← 비즈니스 로직
   │  │  │  ├─ auth_service.py
   │  │  │  ├─ property_service.py
   │  │  │  ├─ review_service.py
   │  │  │  ├─ payment_service.py
   │  │  │  └─ payout_service.py
   │  │  ├─ routers/             ← HTTP 라우터
   │  │  │  ├─ auth.py
   │  │  │  ├─ properties.py
   │  │  │  ├─ reviews.py
   │  │  │  ├─ intents.py
   │  │  │  ├─ payments.py
   │  │  │  ├─ transactions.py
   │  │  │  └─ admin.py
   │  │  ├─ deps/                ← FastAPI Depends (current_user 등)
   │  │  └─ clients/             ← 외부 API 클라이언트 (toss, s3, ses)
   │  ├─ alembic/
   │  │  ├─ env.py
   │  │  └─ versions/
   │  ├─ tests/
   │  ├─ scripts/
   │  │  └─ seed.py              ← 시드 데이터
   │  ├─ pyproject.toml
   │  ├─ Dockerfile
   │  └─ .env.example
   │
   ├─ frontend/
   │  ├─ app/
   │  │  ├─ layout.tsx
   │  │  ├─ page.tsx             ← 매물 리스트 (S-01)
   │  │  ├─ properties/
   │  │  │  └─ [id]/page.tsx     ← 매물 상세 (S-02)
   │  │  ├─ auth/
   │  │  │  ├─ login/page.tsx
   │  │  │  └─ signup/page.tsx
   │  │  ├─ me/...               ← Buyer 마이페이지
   │  │  ├─ appraiser/...        ← Appraiser 영역
   │  │  ├─ broker/...           ← Broker 영역
   │  │  ├─ admin/...
   │  │  ├─ payments/
   │  │  │  ├─ success/page.tsx
   │  │  │  └─ fail/page.tsx
   │  │  └─ transactions/[id]/page.tsx
   │  ├─ features/...            ← 도메인 모듈
   │  ├─ components/ui/...       ← shadcn
   │  ├─ lib/...
   │  ├─ hooks/...
   │  ├─ stores/...
   │  ├─ styles/globals.css
   │  ├─ tailwind.config.ts
   │  ├─ next.config.mjs
   │  ├─ tsconfig.json
   │  ├─ package.json
   │  ├─ Dockerfile
   │  └─ .env.example
   │
   ├─ docker-compose.yml         ← postgres + redis + minio (S3 호환)
   ├─ .gitignore
   └─ README.md                  ← 실행 가이드
```

## 5. 인증/권한 흐름

```
Login Request → /auth/login
  → bcrypt 검증
  → JWT access (15m) + refresh (14d) 발급
  → refresh는 Postgres `refresh_tokens` 테이블에 hash 저장 (logout/blacklist 위해)
Authenticated Request
  → middleware가 Authorization 헤더 검증
  → current_user dependency 주입
  → router에서 role 검사 데코레이터 (`require_roles("appraiser")`)
```

프론트는 access_token을 메모리(zustand) 보관 + refresh_token은 httpOnly 쿠키 권장. (MVP는 localStorage로 시작 가능)

## 6. 핵심 트랜잭션 흐름 — 리뷰 결제

```
1) 프론트: review.purchase 클릭
2) 프론트 → /v1/reviews/{id}/purchase POST (pg_payment_key, amount)
3) 백엔드:
   a. 락 (review_id, buyer_id) UNIQUE 사전 체크
   b. 토스 confirm API 호출 (서버↔서버)
   c. 트랜잭션 START
      - payments INSERT (status=succeeded)
      - review_purchases INSERT
      - payouts INSERT × 2 (platform, appraiser)
   d. 트랜잭션 COMMIT
   e. 알림 비동기 발송 (감정평가사에게)
   f. 응답: { id, unlocked_at }
4) 실패 시: 토스 환불 호출 또는 결제 미승인 처리
```

## 7. S3 업로드 흐름

```
1) 프론트: file 선택
2) 프론트 → /uploads/presign POST (filename, content_type)
3) 백엔드: S3 PutObject Pre-signed URL 생성 (15분)
4) 프론트 → S3 PUT (직접)
5) 프론트 → 백엔드 (예: /reviews 등록 시 evidence_urls에 키 포함)
```

→ 백엔드 부하·트래픽을 S3에 위임.

## 8. 배포 (MVP 기준)

| 컴포넌트 | 환경 | 비고 |
|---|---|---|
| Frontend | **Vercel** (Next.js Preview/Production) | 자동 배포, ISR 활용 |
| Backend | **Render.com** 또는 **AWS App Runner** | Docker 이미지 배포, 단일 인스턴스로 시작 |
| DB | **Supabase Postgres** 또는 **AWS RDS** | 일일 백업 활성화 |
| Redis | Upstash | Free tier로 시작 |
| S3 | AWS S3 + CloudFront | 한국 리전 |
| 모니터링 | Sentry (FE/BE) + Vercel Analytics | |
| CI/CD | GitHub Actions | lint → test → build → deploy 트리거 |

Phase 2: ECS Fargate + RDS Multi-AZ + ElastiCache로 마이그레이션 가능.

## 9. 보안 체크리스트 (MVP 최소)

- [ ] 모든 트래픽 HTTPS 강제 (Vercel/Render 기본)
- [ ] CORS 화이트리스트 (프론트 도메인만)
- [ ] CSRF: refresh_token 쿠키 사용 시 SameSite=Lax + double-submit 토큰
- [ ] SQL Injection: SQLAlchemy ORM 사용, raw 쿼리 시 bindparam
- [ ] XSS: React 기본 이스케이프 + dangerouslySetInnerHTML 금지
- [ ] 비밀번호 정책: 최소 8자, 영문+숫자+특수문자
- [ ] Rate Limiting: 로그인 5회/분, 결제 5회/분 (Redis 카운터)
- [ ] 자격증·계약서 등 민감 파일은 S3 비공개 + 서명 URL (15분)
- [ ] 결제 webhook 서명 검증 필수
- [ ] 관리자 IP 화이트리스트 (선택)

## 10. 관측 (Observability)

- 로그: structlog → stdout → Render/Vercel 수집
- 트레이싱: Sentry (FE/BE) + 요청 ID 헤더 (`X-Request-Id`) 양쪽 전파
- 메트릭: Phase 2에서 Prometheus + Grafana
- 알림: 5xx 비율 > 1% 시 Slack 웹훅
