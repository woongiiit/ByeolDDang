# 별땅 - 토큰(별) 경제 시스템

문서 버전: v0.1
관련 문서: [01-PRD](./01-PRD.md), [04-DB-Schema](./04-DB-Schema.md), [05-API-Spec](./05-API-Spec.md)

## 1. 도입 배경 / 목적

별땅 내부의 결제·정산은 모두 **서비스 내 재화 "별(BYT, ByeolToken)"** 단위로 이뤄진다.

| 기대 효과 |
|---|
| ① 결제 PG 결정을 "**토큰 충전 시점**" 1곳으로 집중 → 리뷰 단건마다 PG 호출 X |
| ② 감정평가사·중개사 정산을 **즉시 토큰 잔액 증가**로 처리 → 회계 단순화 |
| ③ 보너스/프로모션/이벤트 운영 자유도 ↑ (충전 보너스, 가입 축하금 등) |
| ④ 환전(Phase 2) 시점에 KYC·세무 처리 한곳에 집중 |

## 2. 환산 비율 (Conversion)

```
1 별 (BYT) = 100 KRW
```

- DB 저장 단위: **별(정수)**. KRW는 표시용으로 곱하기 100 환산.
- UI 표기: `450별 (₩45,000)` 처럼 별을 우선 노출, 원화 보조 표기.
- 부동산 매매 대금처럼 100억대 거래는 별 단위 표시가 비현실적이므로 **외부 거래(매매)는 KRW 그대로 유지**, 내부 정산만 토큰화.

## 3. 토큰의 흐름 (Flow)

```
① 충전 (Charge):
   매수자 → [PG 결제] → 별 잔액 +N
                       │
                       ▼
② 사용 (Spend):
   매수자 → [리뷰 열람] → 별 잔액 -P  (P = 리뷰 가격)
                       │
                       ▼
③ 적립 (Earn):
   감정평가사 → [리뷰 판매] → 별 잔액 +(P × 0.85)
   플랫폼     → [수수료]    → +(P × 0.15) (시스템 잔액)

④ 환전 (Withdraw, Phase 2):
   감정평가사/중개사 → [신청] → KRW 송금 → 별 잔액 -X
```

## 4. 토큰 패키지 (Charge Packages)

MVP 기본 4종:

| 코드 | 이름 | 가격 (KRW) | 지급 별 | 보너스 | 별/원 |
|---|---|---|---|---|---|
| `starter` | 스타터 | 5,000 | 50 | 0 | 1.00 |
| `basic`   | 베이직 | 20,000 | 200 | 5 | 1.025 |
| `pro`     | 프로  | 50,000 | 500 | 25 | 1.05 |
| `vvip`    | VVIP  | 200,000 | 2,000 | 200 | 1.10 |

규칙:
- 기본 환산은 100원 = 1별. 보너스는 패키지 단위로 더해진다.
- 보너스로 받은 별은 **환전 불가** (Phase 2에서 정책 적용). MVP는 동일 취급.
- 패키지는 운영자(Admin)가 추가/비활성 가능 (DB 시드).

## 5. DB 스키마 (변경/추가분)

### 5.1. 신규 테이블

#### `wallets`
사용자별 별 잔액 (캐시 역할).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | UUID | PK, FK users(id), CASCADE |
| balance_tokens | BIGINT | NOT NULL DEFAULT 0, CHECK >= 0 |
| total_charged | BIGINT | NOT NULL DEFAULT 0 (누적 충전) |
| total_spent | BIGINT | NOT NULL DEFAULT 0 (누적 사용) |
| total_earned | BIGINT | NOT NULL DEFAULT 0 (누적 적립) |
| updated_at | TIMESTAMPTZ | |

#### `token_transactions` (Ledger, immutable)
모든 토큰 이동 기록. **삭제·수정 불가**.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK users(id) |
| direction | VARCHAR(3) | 'in' / 'out' |
| type | VARCHAR(30) | 'charge' / 'spend_review' / 'earn_review_sale' / 'refund' / 'admin_adjust' |
| tokens | BIGINT | 양수 (절대값) |
| balance_after | BIGINT | 트랜잭션 적용 후 잔액 |
| related_id | UUID | review_id / payment_id 등 (NULL 가능) |
| related_type | VARCHAR(30) | 'review_purchase' / 'payment' 등 |
| memo | TEXT | 운영자 메모 |
| created_at | TIMESTAMPTZ | |

인덱스: `(user_id, created_at desc)`, `(related_type, related_id)`

#### `token_packages`
충전 상품 카탈로그.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID | PK |
| code | VARCHAR(30) | UNIQUE (예: 'starter') |
| name | VARCHAR(100) | 표시명 |
| price_krw | INT | 패키지 가격 (원) |
| tokens | INT | 기본 지급 별 |
| bonus_tokens | INT | 보너스 별 (DEFAULT 0) |
| is_active | BOOL | DEFAULT TRUE |
| sort_order | INT | DEFAULT 0 |
| description | TEXT | NULL |

### 5.2. 수정 테이블

#### `reviews` 변경
- `price BIGINT` → 의미를 **별(BYT)** 로 재해석.
- 마이그레이션 시점 기존 KRW 데이터는 100으로 나눈다.

#### `review_purchases` 변경
- `price BIGINT` → 별 단위 (지불한 별 수)
- `platform_fee BIGINT` → 별 단위 (플랫폼 차감 별)
- `appraiser_payout BIGINT` → 별 단위 (평가사 적립 별)
- `payment_id UUID` → **NULLABLE** (토큰 차감은 PG 호출 없이 발생)

#### `payments` 변경
- `purpose` enum에 `'token_charge'` 추가. (`'review'`는 폐기)
- `amount` 의미 유지 (KRW)
- `target_id` → 충전된 `wallet_topup_id` 또는 `token_packages.id` 참조

> 거래 수수료 결제(`purpose='transaction_fee'`)는 그대로 유지.

## 6. 비즈니스 규칙

### 6.1. 충전
1. 사용자가 패키지 선택 → `POST /v1/tokens/charge` (`{package_id}`)
2. (Phase: 결제 PG 미정 동안) 데모 모드: 즉시 `payments.status='succeeded'` + 토큰 적립
3. 실제 PG 도입 시: PG confirm webhook → 적립
4. 트랜잭션 내에서:
   - `payments` row 생성 (KRW)
   - `wallets.balance_tokens += tokens + bonus_tokens`
   - `token_transactions` row 1건 (type=`charge`, tokens=`tokens+bonus`, related=payment)

### 6.2. 사용 (리뷰 결제)
1. 사용자가 리뷰 "해제하기" 클릭 → 잔액 체크
2. 잔액 부족 → 충전 모달 안내 (구매 진행 X)
3. 충분 → `POST /v1/reviews/{id}/purchase` (별도 본문 없음)
4. 트랜잭션:
   - `wallets[buyer].balance_tokens -= price` (CHECK: balance >= price)
   - `wallets[appraiser].balance_tokens += round(price * 0.85)`
   - `review_purchases` row 생성 (price/platform_fee/appraiser_payout, payment_id=NULL)
   - `token_transactions` 2 row (buyer:`spend_review`, appraiser:`earn_review_sale`)
5. 응답: `unlocked_at`, `wallet_balance`(after)

### 6.3. 환불
- 리뷰 미열람 + 24시간 이내: 매수자 잔액 +price, 평가사 잔액 -payout, ledger 2 row (`refund`)
- MVP: 자동 환불은 없고 **관리자 수동 처리** API 제공

### 6.4. 잔액 정합성
- `wallets.balance_tokens` = `Σ token_transactions.signed_tokens` 가 항상 일치해야 함
- 매일 야간 검증 잡 (Phase 2): 불일치 시 Slack 알림

## 7. 권한 / 한도

| 항목 | MVP | 비고 |
|---|---|---|
| 1회 충전 한도 | 200,000 KRW (VVIP 패키지) | 프로모션 시 인상 |
| 1일 충전 한도 | 1,000,000 KRW | Rate Limit |
| 마이너스 잔액 | 금지 (CHECK 제약) | |
| 음수 토큰 트랜잭션 | 금지 (`tokens > 0`) | direction으로 구분 |
| 환전 | 금지 (Phase 2) | |

## 8. API 엔드포인트 (요약)

| Method | Path | 설명 |
|---|---|---|
| GET | `/v1/tokens/packages` | 충전 패키지 목록 (공개) |
| GET | `/v1/me/wallet` | 내 잔액 + 누적 통계 |
| GET | `/v1/me/wallet/transactions` | 내 토큰 거래 내역 (페이지) |
| POST | `/v1/tokens/charge` | 토큰 충전 (데모: 즉시 성공) |
| POST | `/v1/reviews/{id}/purchase` | 리뷰 토큰 결제 → 잠금 해제 |
| POST | `/v1/admin/wallets/{user_id}/adjust` | 관리자 토큰 조정 (`+/-`, memo 필수) |

## 9. UI 표시 규칙

- 헤더 우측: 로그인 시 별 아이콘 + 잔액 (예: `★ 1,250`)
- 0별 또는 부족 시: 충전 CTA 노출
- 가격 표기: `450별` (보조: `₩45,000`)
- 충전 페이지: 패키지 카드 4개, 인기/추천 배지, 환산 비율 안내
- 마이페이지 > 월릿: 잔액 + 누적 통계 + Ledger 테이블

## 10. 마이그레이션 계획 (기존 → 토큰)

| 단계 | 작업 |
|---|---|
| ① | `wallets`, `token_transactions`, `token_packages` 테이블 생성 |
| ② | 기존 모든 user에 대해 `wallets` row 0별로 생성 |
| ③ | `reviews.price` 의미 변경 (KRW → BYT). 시드 갱신 시 100으로 나눠서 재계산 |
| ④ | `review_purchases.payment_id` NULLABLE 변경 |
| ⑤ | `payments` purpose CHECK에 `token_charge` 추가 |
| ⑥ | 시드: 기본 4개 패키지 + 사용자별 초기 잔액 + 샘플 거래 history |

## 11. 향후 확장 (Phase 2+)

- **환전**: 감정평가사·중개사 → 신청 → 관리자 승인 → 통장 입금 (KYC + 원천징수)
- **선물하기**: 사용자 ↔ 사용자 토큰 양도 (이벤트성)
- **만료 정책**: 보너스 별 6개월 만료 등
- **구독제 멤버십**: 매월 일정 토큰 자동 충전
- **이벤트 토큰**: 가입 축하 100별, 친구 추천 50별 등
