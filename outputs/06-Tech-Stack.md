# 별땅 - 기술 스택 선정 및 근거

문서 버전: v0.1

## 1. 한 눈에 보기

| 영역 | 선택 | 대안 | 핵심 근거 |
|---|---|---|---|
| 프론트엔드 | **Next.js 14 (App Router) + TypeScript** | Vite+React, Remix | 매물 SEO·OG 태그·SSR/ISR 필요. 채용 풀 두터움 |
| 스타일 | **TailwindCSS + shadcn/ui** | MUI, Chakra | 디자인 PDF의 미니멀 톤 + 토큰 일치 + 빠른 프로토타이핑 |
| 상태/데이터 | **TanStack Query + Zustand(미니)** | Redux Toolkit | 서버 상태가 95% — RTK 풀스택 과함 |
| 폼 | **react-hook-form + zod** | Formik | 성능·타입 안전성·zod 스키마 재사용 |
| 백엔드 | **FastAPI (Python 3.12) + Pydantic v2** | NestJS, Spring Boot | 타입 자동 검증, OpenAPI 자동 생성, 학습/구현 속도 빠름 |
| ORM | **SQLAlchemy 2.0 (async) + Alembic** | Tortoise, Prisma | 안정성·생태계, 복잡 쿼리 지원 |
| DB | **PostgreSQL 16** | MySQL | JSONB·Array·강한 트랜잭션·전문 검색 |
| 캐시/큐 | **Redis 7** | Memcached | 세션·캐시·간단 잡큐(rq) 겸용 |
| 인증 | **JWT (access 15m / refresh 14d) + bcrypt** | OAuth-only, NextAuth | 모바일/SPA 모두 지원, 단순 |
| 결제 | **토스페이먼츠** | 포트원, 카카오페이 | 국내 결제 1위, 문서/SDK 우수, 정산 API 제공 |
| 파일 스토리지 | **AWS S3 + CloudFront** | R2, GCS | 운영 안정성·국내 인프라·기존 친숙도 |
| 지도/주소 | **카카오 맵·주소 API** | 네이버 | 무료 한도·문서 |
| 메일 | **AWS SES** | SendGrid | 비용·SES 리전 한국 가능 |
| 모니터링 | **Sentry + Grafana(추후)** | Datadog | 에러 추적 무료 한도 충분 |
| 인프라 | **Docker + GitHub Actions + AWS ECS Fargate (Phase 2)** | EC2, k8s | MVP는 단일 EC2/Render도 OK. 추후 ECS |
| 로컬 개발 | **Docker Compose** (postgres, redis, minio) | 직접 설치 | 일관성·온보딩 |

## 2. 결정 근거 상세

### 2.1. 왜 Next.js (App Router)인가
- **SEO**: 매물 상세 페이지가 외부 검색·SNS 공유 진입점이 됨 → SSR/ISR 필요
- **이미지 최적화**: `next/image` 가 매물 사진 다량 처리에 유리
- **Route Handlers**: 결제 webhook 등 일부 BFF를 같은 코드베이스에서 처리 가능 (선택)
- **서버 컴포넌트**: 리뷰 잠금/잠금 해제 UI에서 인증 사용자 분기에 깔끔
- **대안 거부 사유**: Remix는 좋지만 한국 채용 풀 얇음. Vite+React는 SSR 직접 구현 부담

### 2.2. 왜 FastAPI (Python)인가
- **OpenAPI 자동 생성** → 프론트와 계약(Contract) 동기화 자동
- **Pydantic v2**: 빠른 검증, 한국어 메시지 커스텀 용이
- **SQLAlchemy 2.0 async**: 동기/비동기 일관 패턴
- **데이터 분석/머신러닝 확장성**: 추후 부동산 가격 ML 모델·OCR(자격증) 연계 시 동일 언어
- **대안 거부 사유**: NestJS는 훌륭하나 팀 학습 비용·보일러플레이트 큼. Django REST는 빠르지만 async 미성숙

### 2.3. 왜 TailwindCSS + shadcn/ui인가
- 디자인 PDF의 톤(흑백, 둥근 모서리, 미니멀)이 shadcn/ui 기본과 거의 일치
- 디자인 토큰을 `tailwind.config.ts`에 한 번만 정의 → 일관성 확보
- shadcn은 코드 소유 → 커스텀 자유도 ↑

### 2.4. 왜 PostgreSQL인가
- `properties.checklist JSONB`처럼 유연 스키마 일부 필요
- `evidence_urls TEXT[]` 배열 컬럼 활용
- PostGIS 확장으로 추후 지도 검색 자연 확장
- `transactions/payouts` 정산은 강한 ACID 트랜잭션 필수

### 2.5. 왜 토스페이먼츠인가
- **국내 결제 환경**: 카드·계좌·간편결제 다 지원
- **정산(Payout) API**: 감정평가사·중개사에게 자동 송금 지원 (Phase 2 활용)
- **개발자 경험**: 문서·테스트 가맹점·콜백 시뮬레이터 우수
- **대안 비고**: 포트원은 PG 추상화 좋지만 별땅은 단일 PG로도 충분

### 2.6. 왜 모노레포(단일 Git 레포)인가
- 프론트/백엔드 계약 변경 시 동시 PR로 일관성 확보
- 팀 규모 작은 MVP 단계에서 컨텍스트 스위치 비용 ↓
- 단, 빌드/배포 파이프라인은 폴더별 독립

```
ByeolDDang/  (단일 레포)
├─ workspace/
│  ├─ backend/        (FastAPI)
│  ├─ frontend/       (Next.js)
│  ├─ docker-compose.yml
│  └─ README.md
├─ outputs/           (산출물 .md)
└─ reference/         (디자인·기획 PDF)
```

## 3. 버전 고정 (MVP 기준)

### 백엔드 (`pyproject.toml`)
- python = `^3.12`
- fastapi = `^0.115`
- uvicorn[standard] = `^0.30`
- sqlalchemy = `^2.0`
- alembic = `^1.13`
- asyncpg = `^0.29`
- pydantic = `^2.7`
- pydantic-settings = `^2.4`
- python-jose[cryptography] = `^3.3`
- passlib[bcrypt] = `^1.7`
- python-multipart = `^0.0.9`
- httpx = `^0.27`
- redis = `^5.0`
- boto3 = `^1.34`
- pytest, pytest-asyncio, ruff, black, mypy

### 프론트엔드 (`package.json`)
- next = `^14.2`
- react = `^18.3`
- typescript = `^5.4`
- tailwindcss = `^3.4`
- @tanstack/react-query = `^5.40`
- zustand = `^4.5`
- react-hook-form = `^7.51`
- zod = `^3.23`
- axios = `^1.7`
- lucide-react = `^0.400`
- clsx, tailwind-merge
- shadcn/ui (cli로 컴포넌트 추가)

## 4. 환경 변수 표준

### 백엔드 (`.env`)
```
APP_ENV=development          # development | staging | production
DATABASE_URL=postgresql+asyncpg://byeol:byeol@localhost:5432/byeolddang
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=change-me
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=1209600
S3_BUCKET=byeolddang-dev
S3_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
TOSS_SECRET_KEY=test_sk_...
TOSS_CLIENT_KEY=test_ck_...
SES_SENDER=no-reply@byeolddang.com
CORS_ORIGINS=http://localhost:3000
```

### 프론트엔드 (`.env.local`)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/v1
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
NEXT_PUBLIC_KAKAO_MAP_KEY=...
```

## 5. 코드 품질 표준

| 항목 | 도구 |
|---|---|
| Python 포맷 | ruff format (line=100) |
| Python 린트 | ruff check (rules: E,F,I,UP,B,SIM) |
| Python 타입 | mypy --strict (점진적) |
| TS 포맷 | prettier (printWidth=100) |
| TS 린트 | eslint (next/core-web-vitals) |
| 커밋 훅 | lefthook 또는 husky + lint-staged |
| 커밋 메시지 | `type: subject` (사용자 룰 준수) |
| PR 체크 | GitHub Actions (lint, test, build) |

## 6. 테스트 전략

| 영역 | 도구 | 커버리지 목표 |
|---|---|---|
| 백엔드 단위 | pytest + factory_boy | 70% (서비스 레이어) |
| 백엔드 통합 | pytest + httpx + testcontainers-postgres | 핵심 플로우 100% |
| 프론트 단위 | vitest + @testing-library/react | 50% (유틸·훅) |
| E2E | Playwright | 핵심 시나리오 5개 |

## 7. 결정 비교 표 (요약)

| 후보 | 점수 (10점) | 비고 |
|---|---|---|
| Next.js + FastAPI + Postgres | **9** | 채택 |
| Next.js + NestJS + Postgres | 8 | TS 일관성 ↑ but 학습/속도 ↓ |
| Next.js + Django REST + Postgres | 7 | 빠르지만 async 약함 |
| SvelteKit + FastAPI | 6 | 채용 풀 ↓ |
| Spring Boot + React | 6 | 무겁고 MVP 속도 ↓ |
