# 별땅 - 브랜드 자산 (Assets)

별땅 서비스의 시각 자산(로고, 아이콘, OG 이미지 등)을 모아두는 폴더.

## 구조

```
assets/
├─ brand/
│  ├─ logo-mark.svg          ← 다크 배경용 마크 (검은 사각형 + 흰 별)
│  ├─ logo-mark-light.svg    ← 화이트 배경용 마크 (테두리 + 검은 별)
│  └─ logo-wordmark.svg      ← 마크 + 텍스트 "별땅"
├─ icons/
│  ├─ token-coin.svg         ← 토큰(별) 코인 아이콘
│  ├─ shield-escrow.svg      ← 에스크로 안심거래 뱃지
│  └─ appraiser-badge.svg    ← 감정평가사 뱃지
└─ og/
   └─ og-default.svg         ← 기본 OG 카드 (1200x630)
```

## 디자인 토큰

- Primary: `#0A0A0A`
- Surface: `#FFFFFF`
- Bg: `#F7F7F8`
- Accent Gold (Token): `#F59E0B`
- Accent Blue (Escrow): `#2563EB`
- Accent Green (Verified): `#16A34A`
- Accent Red (Price): `#DC2626`

## 사용 방법

### 프론트엔드(Next.js)

`assets/`는 **저장소 자산 라이브러리**이고, 프론트엔드는 직접 `public/`에 복사해 사용합니다.

```powershell
# Windows PowerShell
copy ..\..\assets\brand\logo-mark.svg .\public\
copy ..\..\assets\og\og-default.svg .\public\
```

또는 Next.js에서 SVG를 React 컴포넌트로 임포트하려면 `@svgr/webpack` 추가 후 `import Logo from "@/../assets/brand/logo-mark.svg"`처럼 사용 가능 (Phase 2).

### 새 자산 추가 가이드

1. SVG는 viewBox를 갖춘 정사각형 또는 16:9로 작성
2. 색상은 위 디자인 토큰을 우선 사용
3. 텍스트가 포함된 자산은 한글: Pretendard, 영문: Inter 권장
4. PNG가 필요하면 SVG에서 변환 (`scripts/svg-to-png.ps1` 추후 추가 예정)
