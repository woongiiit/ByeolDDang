# 별땅 - Railway 배포 가이드

문서 버전: v0.1
대상 환경: Railway 단일 프로젝트 + 다중 서비스(Postgres / Redis / Backend / Frontend)

> Railway는 GitHub repo 단위로 자동 배포되는 PaaS. Vercel(Frontend)+ Render(Backend) 조합 대신 **모든 서비스를 Railway 프로젝트 1개**에 모아 운영비/네트워크 단순화.

## 1. 사전 준비

| 항목 | 내용 |
|---|---|
| Railway 계정 | https://railway.app, GitHub 로그인 권장 |
| GitHub Repo | 모노레포 (`workspace/` 루트 또는 `backend/`, `frontend/` 분리 가능) |
| 도메인 | `byeolddang.com` (선택). Railway 기본 도메인 `*.up.railway.app` 사용 가능 |
| Plan | MVP 검증 단계: Hobby ($5/월). 트래픽 발생 후 Pro 전환 |

## 2. 프로젝트 구조

```
Railway Project: byeolddang
├─ Postgres (DB)              ← Railway 내장 (1-click)
├─ Redis    (Cache/Queue)     ← Railway 내장 (1-click)
├─ backend  (FastAPI)         ← workspace/backend
└─ frontend (Next.js)         ← workspace/frontend
```

서비스 간 호출은 Railway 내부 네트워크 (`*.railway.internal`)로 무료, 외부 노출은 `Public Networking` 토글로 도메인 부여.

## 3. 단계별 가이드

### Step 1. 프로젝트 생성

1. Railway 대시보드 → **New Project** → **Deploy from GitHub repo**
2. `byeolddang` 레포 선택. Branch: `main`
3. **Root directory**: 일단 비워둠 (서비스별로 따로 설정)

### Step 2. Postgres 추가

```
+ New → Database → PostgreSQL
```

자동으로 `DATABASE_URL` 환경변수가 프로젝트에 노출됨. 다른 서비스에서 `${{Postgres.DATABASE_URL}}` 형태로 참조.

### Step 3. Redis 추가

```
+ New → Database → Redis
```

생성 후 `REDIS_URL` 환경변수 노출.

### Step 4. Backend 서비스 (FastAPI)

```
+ New → GitHub Repo → byeolddang
Service Settings:
  Root Directory : workspace/backend
  Build Command  : pip install -e .
  Start Command  : uvicorn app.main:app --host 0.0.0.0 --port $PORT
  Healthcheck    : /health
```

환경변수 (Variables 탭):

```
APP_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
ACCESS_TOKEN_EXPIRES_MIN=30
REFRESH_TOKEN_EXPIRES_DAYS=14
CORS_ORIGINS=https://app.byeolddang.com,https://byeolddang.com
S3_ENDPOINT=https://s3.ap-northeast-2.amazonaws.com  (또는 R2/MinIO)
S3_BUCKET=byeolddang-prod
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=ap-northeast-2
TOSS_SECRET_KEY=  (PG 도입 시 설정)
TOSS_CLIENT_KEY=
SENDER_EMAIL=no-reply@byeolddang.com
```

**최초 배포 직후** Railway Run Command (혹은 SSH)로:

```
alembic upgrade head
python -m scripts.seed   # (선택) 데모 데이터 시드
```

`Public Networking` 토글 → 도메인 `api.byeolddang.com` 매핑 (CNAME 설정).

### Step 5. Frontend 서비스 (Next.js)

```
+ New → GitHub Repo → byeolddang
Service Settings:
  Root Directory : workspace/frontend
  Build Command  : npm ci && npm run build
  Start Command  : npm run start
  Healthcheck    : /
```

환경변수:

```
NEXT_PUBLIC_API_BASE_URL=https://api.byeolddang.com/v1
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_TOSS_CLIENT_KEY=  (PG 도입 시)
```

도메인: `app.byeolddang.com` 또는 루트 `byeolddang.com` (Vercel 대신 Railway에서 SSL 자동).

### Step 6. CORS 검증

배포 후 브라우저 DevTools → Network에서 `OPTIONS` preflight 200 OK 확인. 실패 시 backend `CORS_ORIGINS` 재확인.

## 4. 비용 추정 (MVP, Hobby Plan)

| 서비스 | 메모리 | 예상 비용/월 |
|---|---|---|
| Postgres (1GB) | 0.5GB RAM | $5 |
| Redis (256MB) | 0.25GB RAM | $5 |
| Backend (FastAPI) | 0.5GB RAM | $5 |
| Frontend (Next.js) | 1GB RAM | $5–10 |
| **합계** | | **$20–25/월** |

> 트래픽 미미한 MVP 시 Backend·Frontend 서비스를 **Sleep** 모드로 두면 더 절감 가능 (요청 시 자동 wake-up, cold start 1–2초).

## 5. CI/CD

Railway는 **GitHub push → 자동 빌드/배포**. 별도 GitHub Actions 불필요.

권장 워크플로:

| 브랜치 | Railway 환경 |
|---|---|
| `main` | production (api.byeolddang.com / app.byeolddang.com) |
| `staging` | staging 환경 (별도 프로젝트 또는 Environments 기능) |
| 기타 PR | Preview Environment (Pro 플랜) |

## 6. 시크릿 관리

- DB/JWT/Toss 등 **모든 시크릿은 Railway Variables UI에 입력**, repo에는 절대 커밋 X.
- 로컬 개발은 `.env` 파일 (gitignore). 팀 공유는 1Password/Bitwarden에 dev 시크릿 저장.

## 7. 운영 체크리스트

- [ ] Production DB 정기 백업 활성화 (Railway 자동 데일리 스냅샷)
- [ ] Sentry DSN 설정 (백엔드/프론트 모두)
- [ ] `/health` 모니터링 (UptimeRobot 5분 간격)
- [ ] 로그 보관: Railway 7일 → 장기 보관은 Logtail/BetterStack 연동 (Phase 2)
- [ ] Rate limit: 토큰 충전 1일 1,000,000 KRW 제한 미들웨어 적용
- [ ] HTTPS only (Railway 자동), HSTS 헤더 추가
- [ ] CSP / X-Frame-Options 등 보안 헤더는 Next.js `next.config.mjs` `headers()`로 설정

## 8. 트러블슈팅

| 현상 | 원인/해결 |
|---|---|
| `Connection refused` Postgres | 환경변수 `DATABASE_URL` 미설정. 서비스 재시작 |
| Migration 미적용 | Run Command 미실행. Railway Shell → `alembic upgrade head` |
| `CORS error` | backend `CORS_ORIGINS`에 frontend 도메인 정확히 추가 |
| `Module not found` Next.js | Root Directory가 `workspace/frontend`인지 확인 |
| Cold start 느림 | Hobby 플랜 sleep mode. Pro로 전환 또는 `min instances=1` |

## 9. 다음 단계

- 도메인 + SSL 자동 (`*.up.railway.app` → 커스텀)
- Sentry / Discord 알림 webhook
- Object Storage: Cloudflare R2 (Railway에 R2 ENV 등록)
- 부하 증가 시 Backend 수평 확장 (replicas) 검토
