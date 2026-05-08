# 별땅 - REST API 명세서

문서 버전: v0.2 (MVP, 토큰 시스템 반영)
Base URL: `https://api.byeolddang.com/v1` (개발: `http://localhost:8000/v1`)

> **v0.2 변경 요약**: 토큰 시스템 도입에 따라 `/tokens/*`, `/me/wallet*`, `/admin/wallets/*` 추가.
> 리뷰 결제(`POST /reviews/{id}/purchase`)는 **PG 호출 없이 토큰 잔액 차감** 방식으로 동작. 자세한 사항은 [09-Token-System.md](./09-Token-System.md).

## 1. 공통 규칙

- **인증**: `Authorization: Bearer <JWT>` 헤더 (로그인/회원가입 제외)
- **Content-Type**: `application/json` (파일 업로드는 `multipart/form-data`)
- **에러 형식**:
  ```json
  { "error": { "code": "INVALID_INPUT", "message": "...", "details": {...} } }
  ```
- **성공 응답**: 자원 객체 또는 `{ "data": [...], "meta": { "page": 1, "total": 50 } }`
- **페이지네이션**: `?page=1&size=20` (기본 size=20, 최대 100)
- **정렬**: `?sort=-created_at` (앞 `-`는 desc)
- **필드 선택**: `?fields=id,title,price` (옵션, MVP에선 미구현 가능)
- **Idempotency**: 결제·정산 POST는 `Idempotency-Key` 헤더 권장

## 2. 인증 (Auth)

### POST `/auth/signup`
회원가입.
```json
// Request
{
  "email": "user@example.com",
  "password": "Strong!123",
  "name": "김매수",
  "phone": "+821012345678",
  "roles": ["buyer"]   // ["buyer"] | ["appraiser"] | ["broker"]
}
// 201 Response
{ "id": "uuid", "email": "...", "roles": ["buyer"], "access_token": "...", "refresh_token": "..." }
```

### POST `/auth/login`
```json
// Request
{ "email": "...", "password": "..." }
// 200 Response
{ "access_token": "...", "refresh_token": "...", "user": { "id":"...", "name":"...", "roles":["buyer"] } }
```

### POST `/auth/refresh`
```json
// Request
{ "refresh_token": "..." }
// 200
{ "access_token": "...", "refresh_token": "..." }
```

### POST `/auth/logout`
- `204 No Content` (refresh_token 무효화)

### GET `/me`
- 현재 로그인 사용자 정보 (역할 포함)

## 3. 사용자/프로필

### POST `/me/appraiser-profile`
감정평가사 프로필 등록 → 관리자 승인 대기.
```json
{
  "license_no": "AP-2014-12345",
  "license_image_url": "s3://byeolddang/licenses/...",
  "years_of_experience": 12,
  "specialty": "토지·빌딩",
  "bio": "..."
}
// 201 → status: "pending"
```

### POST `/me/broker-profile`
공인중개사 프로필 등록.

### GET `/users/{userId}`
공개 프로필 (이름, 아바타, 역할, 평가사 경력 등).

## 4. 매물 (Properties)

### GET `/properties`
매물 리스트 (검색·필터).
- 쿼리: `q, category, region_code, price_min, price_max, area_min, area_max, sort, page, size`
```json
// 200
{
  "data": [
    {
      "id": "uuid",
      "title": "더 힐즈 모던 하우스",
      "category": "villa",
      "address": "서울특별시 용산구 한남동 123-45",
      "price": 12500000000,
      "area_m2": 245.8,
      "rooms": 5,
      "bathrooms": 4,
      "is_premium": true,
      "main_image_url": "...",
      "rating_avg": 4.8,
      "review_count": 3
    }
  ],
  "meta": { "page": 1, "size": 20, "total": 124 }
}
```

### GET `/properties/{id}`
매물 상세 (이미지·중개사·리뷰 메타 포함, 리뷰 본문은 잠긴 상태).
```json
{
  "id": "...",
  "title": "...",
  "title_en": "The Hills Modern",
  "category": "villa",
  "address": "...",
  "latitude": 37.534,
  "longitude": 127.001,
  "price": 12500000000,
  "area_m2": 245.8,
  "area_pyeong": 74,
  "rooms": 5,
  "bathrooms": 4,
  "parking": 3,
  "build_year": 2023,
  "description": "...",
  "checklist": { "site_visit": true, "registry_verified": true, "remodeling_package": true },
  "images": [{ "url": "...", "is_main": true }, ...],
  "broker": { "id": "...", "name": "박성훈", "office_name": "...", "avatar_url": "..." },
  "reviews_summary": { "count": 3, "min_price": 39000, "max_price": 75000, "avg_rating": 4.7 }
}
```

### POST `/properties` (Broker only)
매물 등록.
```json
{
  "title": "...",
  "category": "villa",
  "address": "...",
  "address_detail": "...",
  "region_code": "11170",
  "latitude": 37.534, "longitude": 127.001,
  "price": 12500000000,
  "area_m2": 245.8,
  "rooms": 5, "bathrooms": 4, "parking": 3,
  "build_year": 2023,
  "description": "...",
  "checklist": { "site_visit": true, "registry_verified": true }
}
// 201
```

### PATCH `/properties/{id}` (Broker — 본인 매물)
일부 필드 수정.

### DELETE `/properties/{id}` (Broker — 본인 매물)
소프트 삭제.

### POST `/properties/{id}/images` (Broker)
- multipart: `file` (반복) → 자동 리사이즈, S3 업로드, 썸네일 생성
- 응답: `[{ id, url, thumbnail_url, sort_order }]`

### PATCH `/properties/{id}/status` (Broker)
- `{ "status": "active" | "withdrawn" }`

## 5. 리뷰 (Reviews)

### GET `/properties/{propertyId}/reviews`
매물의 리뷰 목록 (잠긴 메타 + 본인 결제분은 본문 포함).
```json
{
  "data": [
    {
      "id": "uuid",
      "appraiser": { "id": "...", "name": "김철수 감정사", "avatar_url": "...", "years": 15, "rating_avg": 4.9 },
      "estimated_value_masked": "1.X억원",
      "market_outlook": "neutral",
      "price": 45000,
      "is_unlocked": false,
      "purchased_at": null,
      "published_at": "2026-04-21T...",
      // 잠금 해제 시:
      "estimated_value": 12480000000,
      "confidence_level": "high",
      "outlook_reason": "...",
      "analysis_summary": "...",
      "evidence_urls": ["...", "..."],
      "disclaimer_field_visit": true
    }
  ]
}
```

### POST `/reviews` (Appraiser only, approved)
리뷰 작성·발행.
```json
{
  "property_id": "uuid",
  "estimated_value": 12480000000,
  "confidence_level": "high",
  "market_outlook": "neutral",
  "outlook_reason": "...",
  "analysis_summary": "...",
  "evidence_urls": ["s3://...","s3://..."],
  "price": 45000,
  "disclaimer_field_visit": true,
  "publish": true   // false=draft, true=published
}
// 201
```

### PATCH `/reviews/{id}` (Appraiser — draft만)
- 발행된 리뷰는 수정 불가 (정책)

### POST `/reviews/{id}/purchase` (Buyer)
리뷰 결제 (PG 호출 → webhook으로 완결 또는 inline confirm).
```json
{
  "pg_provider": "toss",
  "pg_payment_key": "...",  // 토스페이먼츠 결제 승인 키
  "amount": 45000
}
// 201
{
  "id": "review_purchase_uuid",
  "review_id": "...",
  "status": "succeeded",
  "unlocked_at": "2026-05-08T..."
}
```

### POST `/reviews/{id}/view` (Buyer)
- 최초 열람 시각 기록 (환불 정책 판정용). idempotent.

## 6. 매수 의향서 (Purchase Intents)

### POST `/properties/{propertyId}/intents` (Buyer)
```json
{
  "offered_price": 11800000000,
  "desired_close_date": "2026-08-31",
  "message": "잔금 일정 협의 가능합니다."
}
// 201
```

### GET `/me/intents` (Buyer)
- 내가 제출한 의향서 목록

### GET `/broker/intents` (Broker)
- 내 매물에 들어온 의향서 목록 (status 필터: `submitted`, `accepted` 등)

### PATCH `/intents/{id}/status` (Broker)
- `{ "status": "viewed" | "accepted" | "rejected" }`

## 7. 결제 (Payments) - PG 콜백

### POST `/payments/toss/confirm`
토스페이먼츠 결제 승인. (서버 ↔ 토스 통신)
```json
{ "payment_key": "...", "order_id": "...", "amount": 45000 }
```

### POST `/payments/webhooks/toss`
PG webhook (서명 검증).

### GET `/payments/{id}`
결제 상세.

### POST `/payments/{id}/refund` (Admin or Buyer-자동)
환불 (조건: 리뷰 미열람, 정책 기한 내).

## 8. 거래 (Transactions)

### POST `/properties/{propertyId}/transactions` (Broker)
거래 완료 보고.
```json
{
  "buyer_id": "uuid",
  "sale_price": 850000000,
  "contract_doc_url": "s3://..."
}
// 201 → status: "reported"
```

### POST `/admin/transactions/{id}/verify` (Admin)
관리자 검증 → 정산 계산 + payouts row 자동 생성.

### GET `/transactions/{id}`
거래 정산 페이지용 응답.
```json
{
  "id": "TRX-...",
  "property_id": "...",
  "sale_price": 850000000,
  "platform_fee": 42500000,
  "broker_fee": 25500000,
  "appraiser_bonus_total": 5000000,
  "status": "settled",
  "settled_at": "2026-05-12T...",
  "ledger": [
    { "label": "부동산 매매 가액 (순수)", "amount": 850000000, "recipient_role": "broker" },
    { "label": "EvalEstate 거래 중개 플랫폼 수수료", "amount": 42500000, "recipient_role": "platform" },
    { "label": "에이전트 중개 수수료", "amount": 25500000, "recipient_role": "broker" },
    { "label": "시장 가치 정밀 감정서 (VIP)", "amount": 2500000, "recipient_role": "appraiser" },
    { "label": "향후 투자 전망 분석 보고서", "amount": 2500000, "recipient_role": "appraiser" }
  ]
}
```

## 9. 정산 (Payouts)

### GET `/me/payouts`
- 내가 받을 / 받은 정산 내역 (역할별 필터링)

## 10. 알림 (Notifications)

### GET `/me/notifications?unread=true`
### POST `/me/notifications/{id}/read`
### POST `/me/notifications/read-all`

## 11. 관리자 (Admin)

### GET `/admin/appraisers?status=pending`
승인 대기 평가사 목록.

### POST `/admin/appraisers/{userId}/approve`
### POST `/admin/appraisers/{userId}/reject`  (`{ "reason": "..." }`)

### GET `/admin/transactions?status=reported`
검증 대기 거래.

## 12. 파일 업로드 (S3 Pre-signed)

### POST `/uploads/presign`
```json
// Request
{ "filename": "field-photo.jpg", "content_type": "image/jpeg", "purpose": "review_evidence" }
// 200
{
  "url": "https://s3...",
  "method": "PUT",
  "headers": { "Content-Type": "image/jpeg" },
  "key": "reviews/2026/05/08/uuid.jpg",
  "public_url": "https://cdn.byeolddang.com/..."
}
```

## 13. 상태 코드 표준

| 코드 | 의미 |
|---|---|
| 200 | 성공 |
| 201 | 생성 성공 |
| 204 | 본문 없음 |
| 400 | 입력 검증 실패 (`INVALID_INPUT`) |
| 401 | 인증 필요 (`UNAUTHENTICATED`) |
| 403 | 권한 없음 (`FORBIDDEN`) |
| 404 | 자원 없음 (`NOT_FOUND`) |
| 409 | 충돌 (중복 등록 등, `CONFLICT`) |
| 422 | 의미적 검증 실패 (자격 미승인 등, `UNPROCESSABLE`) |
| 429 | Rate Limit (`TOO_MANY`) |
| 500 | 서버 오류 (`INTERNAL`) |

## 14. OpenAPI

- FastAPI는 자동으로 `/docs` (Swagger) / `/redoc` 제공
- MVP에선 추가 작업 없이 자동 생성 문서 사용

## 15. 토큰 시스템 엔드포인트 (v0.2 추가)

자세한 비즈니스 규칙은 [09-Token-System.md](./09-Token-System.md). 모든 경로는 `Authorization: Bearer <JWT>` 필요 (`/tokens/packages` 제외).

### 15.1. 토큰 패키지 조회

```
GET /v1/tokens/packages           (공개)
```

응답:
```json
[
  {"id":"<uuid>","code":"starter","name":"스타터","price_krw":5000,"tokens":50,"bonus_tokens":0,"sort_order":0,"description":"..."},
  {"id":"<uuid>","code":"basic","name":"베이직","price_krw":20000,"tokens":200,"bonus_tokens":5,"sort_order":1,"description":"..."}
]
```

### 15.2. 내 월렛 조회

```
GET /v1/me/wallet
```

응답:
```json
{
  "user_id": "<uuid>",
  "balance_tokens": 1500,
  "total_charged": 1500,
  "total_spent": 0,
  "total_earned": 0,
  "updated_at": "2026-05-08T12:00:00Z"
}
```

### 15.3. 거래 내역

```
GET /v1/me/wallet/transactions?page=1&size=30
```

응답: `{ "data": [TokenTransaction...], "meta": { "page", "size", "total" } }`

### 15.4. 토큰 충전

```
POST /v1/tokens/charge
Body: { "package_id": "<uuid>" }
```

MVP 데모 모드: 즉시 성공 (PG 미연동). 실제 PG 도입 후 `payment_intent` → `confirm webhook`으로 분리 예정.

응답 (201):
```json
{
  "payment_id": "<uuid>",
  "package": { ... },
  "granted_tokens": 205,
  "wallet": { "user_id":..., "balance_tokens": 1705, ... }
}
```

### 15.5. 리뷰 토큰 결제 (변경)

```
POST /v1/reviews/{review_id}/purchase
```

본문 없음. **PG 호출 없이 잔액 차감**.
- 잔액 부족: `422 UNPROCESSABLE` (`Insufficient token balance`)
- 자기 리뷰 구매: `409 CONFLICT`
- 이미 구매: `409 CONFLICT` (`Already purchased`)

응답 (201):
```json
{
  "id": "<uuid>",
  "review_id": "<uuid>",
  "price_tokens": 450,
  "platform_fee_tokens": 68,
  "appraiser_payout_tokens": 382,
  "unlocked_at": "2026-05-08T12:00:00Z",
  "wallet_balance": 1050
}
```

### 15.6. 매수 의향서

```
POST /v1/properties/{property_id}/intents
Body: { "offered_price": 12000000000, "desired_close_date": "2026-06-30", "message": "..." }
```

```
GET  /v1/me/intents              (Buyer 자신이 제출한 목록)
GET  /v1/broker/intents          (Broker: 자기 매물에 들어온 의향서)
```

### 15.7. 중개사 매물 관리

```
GET  /v1/broker/properties              (자기 매물 목록)
POST /v1/properties                     (매물 등록)
POST /v1/properties/{id}/images         (이미지 URL 등록)
```

### 15.8. 감정사 작업실

```
GET  /v1/appraiser/reviews              (자기가 발행한 리뷰 목록)
POST /v1/reviews                        (리뷰 작성·발행)
```

### 15.9. 관리자

```
GET  /v1/admin/appraisers?status=pending
POST /v1/admin/appraisers/{user_id}/approve         (204)
POST /v1/admin/appraisers/{user_id}/reject          (Body: {reason})
GET  /v1/admin/brokers?status=pending
POST /v1/admin/brokers/{user_id}/approve            (204)
GET  /v1/admin/transactions                         (검증 대기 거래)
POST /v1/admin/transactions/{tx_id}/verify          (정산 트리거)
POST /v1/admin/wallets/{user_id}/adjust             (Body: {delta_tokens, memo})
```
