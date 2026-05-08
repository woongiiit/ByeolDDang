# 별땅 (ByeolDDang) - Workspace

별땅 서비스의 모노레포 워크스페이스. 백엔드(FastAPI) + 프론트엔드(Next.js) + 공용 자산(assets) + 인프라 설정.

## 폴더 구조

```
workspace/
├─ backend/              ← FastAPI 백엔드 (Python 3.12)
│  ├─ app/
│  │  ├─ core/           ← 설정·DB·보안·예외
│  │  ├─ models/         ← SQLAlchemy 모델
│  │  ├─ schemas/        ← Pydantic 스키마
│  │  ├─ services/       ← 비즈니스 로직
│  │  ├─ routers/        ← FastAPI 라우터
│  │  ├─ deps/           ← 인증 등 의존성
│  │  └─ main.py
│  ├─ alembic/           ← 마이그레이션
│  ├─ scripts/seed.py    ← 시드 데이터
│  └─ pyproject.toml
├─ frontend/             ← Next.js 14 (App Router) + TypeScript
│  ├─ app/               ← 페이지 (RSC)
│  ├─ components/
│  ├─ features/          ← 도메인별 API 함수
│  ├─ stores/            ← Zustand 글로벌 상태
│  ├─ hooks/
│  ├─ lib/               ← 공통 util / api client
│  ├─ mocks/             ← USE_MOCK=true 시 사용
│  └─ public/
├─ assets/               ← 브랜드 자산 (로고, 아이콘, OG)
├─ docker-compose.yml    ← 로컬 개발용 (Postgres + Redis + MinIO + Backend + Frontend)
└─ README.md             ← 이 파일
```

## 빠른 시작

### 옵션 A: 프론트엔드만 (Mock 데이터)

가장 빠르게 화면을 둘러볼 수 있는 방법.

```powershell
cd frontend
copy .env.example .env.local       # NEXT_PUBLIC_USE_MOCK=true 로 두기
npm install
npm run dev
# http://localhost:3000
```

이 모드에서는 매물 리스트/상세/리뷰가 mock 데이터로 동작합니다. 로그인·토큰·관리자 화면은 실제 API가 필요합니다.

### 옵션 B: 풀스택 로컬 (Docker Compose)

```powershell
cd workspace
docker compose up -d --build
# 또는 backend/frontend는 호스트에서 띄우고 db/redis만 docker
docker compose up -d postgres redis minio
```

이후 백엔드 마이그레이션·시드 실행:

```powershell
cd backend
copy .env.example .env
pip install -e .
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

별도 터미널에서 프론트:

```powershell
cd frontend
copy .env.example .env.local
# .env.local 에서 NEXT_PUBLIC_USE_MOCK=false 로 변경
npm install
npm run dev
```

## 주요 환경변수

### Backend `.env`

| 변수 | 예시 | 설명 |
|---|---|---|
| `APP_ENV` | `dev` | 환경 식별 |
| `DATABASE_URL` | `postgresql+asyncpg://byeol:byeol@localhost:5432/byeol` | 비동기 드라이버 |
| `REDIS_URL` | `redis://localhost:6379/0` | |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | 32바이트 랜덤 | `openssl rand -hex 32` |
| `CORS_ORIGINS` | `http://localhost:3000` | 콤마 구분 |

### Frontend `.env.local`

| 변수 | 예시 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/v1` | 백엔드 |
| `NEXT_PUBLIC_USE_MOCK` | `false` | true면 mock 데이터로 동작 |

## 시드 계정

`python -m scripts.seed` 후 사용 가능:

| 역할 | 이메일 | 비번 | 비고 |
|---|---|---|---|
| 매수자 | buyer@byeolddang.com | buyer1234! | **1,500코인 (₩150,000) 보유** |
| 감정사 1 | kim.appraiser@byeolddang.com | appraiser1234! | 강남 토지·빌딩 |
| 감정사 2 | choi.appraiser@byeolddang.com | appraiser1234! | 수익형·상가 |
| 중개사 1 | park.broker@byeolddang.com | broker1234! | 한남/용산 |
| 중개사 2 | lee.broker@byeolddang.com | broker1234! | 강남 |
| 관리자 | admin@byeolddang.com | admin1234! | 감정사·거래 승인 |

## 핵심 화면

| 경로 | 설명 | 권한 |
|---|---|---|
| `/` | 매물 마켓플레이스 (홈) | 공개 |
| `/properties/[id]` | 매물 상세 + 리뷰 목록 | 공개 (잠긴 리뷰는 코인 결제) |
| `/properties/[id]/intent` | 매수 의향서 제출 | 로그인 |
| `/auth/login` · `/auth/signup` | 인증 | - |
| `/wallet/charge` | 코인 충전 (4종 패키지) | 로그인 |
| `/me` | 마이페이지 (역할별 진입점 + 잔액) | 로그인 |
| `/me/wallet` | 코인 월렛 + Ledger | 로그인 |
| `/me/intents` | 내가 제출한 의향서 | 로그인 |
| `/broker` | 중개사 작업실 (등록 매물) | broker |
| `/broker/properties/new` | 매물 등록 폼 | broker |
| `/broker/intents` | 수신 의향서 | broker |
| `/appraiser` | 감정사 작업실 (발행 리뷰) | appraiser |
| `/appraiser/reviews/new` | 리뷰 작성/발행 | appraiser |
| `/admin` | 관리자 대시보드 | admin |
| `/admin/appraisers` | 감정사·중개사 자격 승인 | admin |
| `/admin/transactions` | 거래 검증/정산 | admin |
| `/transactions/[id]` | 거래 정산 요약 (모의) | 관계자 |
| `/payments/success` | 결제 완료 (목업) | 로그인 |

## 핵심 백엔드 엔드포인트

자세한 내용은 [outputs/05-API-Spec.md](../outputs/05-API-Spec.md). 핵심만:

```
POST   /v1/auth/signup                         회원가입
POST   /v1/auth/login                          로그인
GET    /v1/me                                  내 프로필

GET    /v1/properties                          매물 리스트
GET    /v1/properties/{id}                     매물 상세
POST   /v1/properties                          매물 등록 (broker)
GET    /v1/broker/properties                   내 매물 목록 (broker)

GET    /v1/properties/{id}/reviews             매물별 리뷰
POST   /v1/reviews                             리뷰 작성 (appraiser, approved)
POST   /v1/reviews/{id}/purchase               리뷰 코인 결제 → 잠금 해제
GET    /v1/appraiser/reviews                   내 리뷰 목록

POST   /v1/properties/{id}/intents             매수 의향서 제출 (buyer)
GET    /v1/me/intents                          내 의향서
GET    /v1/broker/intents                      수신 의향서 (broker)

GET    /v1/tokens/packages                     충전 패키지 (공개)
GET    /v1/me/wallet                           내 코인 월렛
GET    /v1/me/wallet/transactions              코인 거래 내역
POST   /v1/tokens/charge                       코인 충전 (데모: 즉시 성공)

GET    /v1/admin/appraisers?status=pending     감정사 승인 대기 (admin)
POST   /v1/admin/appraisers/{user_id}/approve
POST   /v1/admin/appraisers/{user_id}/reject
GET    /v1/admin/brokers
POST   /v1/admin/brokers/{user_id}/approve
GET    /v1/admin/transactions                  거래 검증 대기
POST   /v1/admin/transactions/{tx_id}/verify   정산 트리거
POST   /v1/admin/wallets/{user_id}/adjust      코인 수동 조정
```

OpenAPI/Swagger: `http://localhost:8000/docs`

## 코인(BYT) 시스템

별땅 내부 결제·정산은 모두 **코인(BYT)** 으로 통일합니다. (화면 명칭은 리뷰 별점과 구분하기 위해 “코인”, API·DB 필드명은 `token` 등 기존 유지.)

- **환산**: `1 코인 = 100 KRW`
- **충전 패키지** (시드 기준): 스타터 50코인 / 베이직 205코인 / 프로 525코인 / VVIP 2,200코인
- **사용**: 리뷰 1건 결제 시 코인 차감 (가격은 매 리뷰마다 감정사가 설정, 시드 기준 350~750코인)
- **적립**: 감정사는 판매가의 85%를 즉시 코인 잔액으로 적립
- **환전**: MVP는 미지원 (Phase 2)
- **자세한 설계**: [outputs/09-Token-System.md](../outputs/09-Token-System.md)

## 개발 가이드

### 백엔드 마이그레이션

```powershell
cd backend
alembic revision -m "your message" --autogenerate
alembic upgrade head
```

### 프론트엔드 빌드/검사

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build
```

### Lint/Format

- 백엔드: `ruff check`, `black .`, `mypy app/`
- 프론트엔드: `npm run lint`

## 배포

[outputs/10-Deployment-Railway.md](../outputs/10-Deployment-Railway.md) 참조. 요약:

1. Railway 프로젝트 생성 → Postgres / Redis 서비스 추가
2. backend 서비스 (`workspace/backend`) → 환경변수 설정 → 배포 → `alembic upgrade head`
3. frontend 서비스 (`workspace/frontend`) → 환경변수 (`NEXT_PUBLIC_API_BASE_URL`) → 배포
4. 도메인 매핑 (`api.byeolddang.com`, `app.byeolddang.com`)

## 다음 작업 후보

- 결제 PG 연동 (토스페이먼츠 / 포트원) — 토큰 충전 흐름에 끼워넣기
- S3 직접 업로드 (현재는 외부 URL만 지원)
- 알림 시스템 (이메일 + 인앱)
- 감정사 평판/리뷰 시스템
- 매수자 즐겨찾기 / 비교
- 카카오 지도 SDK
- 환전(출금) 기능 + KYC
