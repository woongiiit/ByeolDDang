"""시드 데이터 생성 스크립트.

사용:  python -m scripts.seed
재실행 시 모든 데이터 초기화 후 재생성 (개발용).
"""
import asyncio
from datetime import UTC, datetime

from sqlalchemy import delete, select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.payment import Payment, Payout, ReviewPurchase, Transaction
from app.models.property import Property, PropertyImage, PurchaseIntent
from app.models.review import Review
from app.models.user import AppraiserProfile, BrokerProfile, User, UserRole
from app.models.wallet import TokenPackage, TokenTransaction, Wallet

NOW = datetime.now(UTC)


# ---------- 토큰 패키지 ----------
TOKEN_PACKAGES = [
    {"code": "starter", "name": "스타터", "price_krw": 5_000, "tokens": 50, "bonus": 0,
     "desc": "처음 별땅을 사용해보는 분께 추천."},
    {"code": "basic", "name": "베이직", "price_krw": 20_000, "tokens": 200, "bonus": 5,
     "desc": "리뷰 1~2건 비교에 적합한 패키지."},
    {"code": "pro", "name": "프로", "price_krw": 50_000, "tokens": 500, "bonus": 25,
     "desc": "주력 매물 분석에 가장 인기있는 옵션."},
    {"code": "vvip", "name": "VVIP", "price_krw": 200_000, "tokens": 2_000, "bonus": 200,
     "desc": "복수 매물 비교/장기 사용자용 최대 보너스."},
]


# ---------- 시드 사용자 ----------
USERS_DATA = [
    {"key": "admin", "email": "admin@byeolddang.com", "password": "admin1234!", "name": "별땅 관리자", "roles": ["admin"]},
    {"key": "broker_park", "email": "park.broker@byeolddang.com", "password": "broker1234!", "name": "박성훈", "roles": ["broker"]},
    {"key": "broker_lee", "email": "lee.broker@byeolddang.com", "password": "broker1234!", "name": "이중개", "roles": ["broker"]},
    {"key": "appraiser_kim", "email": "kim.appraiser@byeolddang.com", "password": "appraiser1234!", "name": "김철수 감정사", "roles": ["appraiser"]},
    {"key": "appraiser_choi", "email": "choi.appraiser@byeolddang.com", "password": "appraiser1234!", "name": "최전망 감정사", "roles": ["appraiser"]},
    {"key": "buyer", "email": "buyer@byeolddang.com", "password": "buyer1234!", "name": "김매수", "roles": ["buyer"]},
]


# 가격 단위는 모두 별(BYT). 1별 = 100원.
REVIEW_SEED = [
    # (property_idx, appraiser_key, est_value_KRW, outlook, price_TOKENS)
    (0, "appraiser_kim", 12_480_000_000, "neutral", 750),
    (0, "appraiser_choi", 12_300_000_000, "bullish", 490),
    (1, "appraiser_kim", 4_400_000_000, "neutral", 450),
    (1, "appraiser_choi", 4_550_000_000, "bullish", 390),
    (2, "appraiser_kim", 2_750_000_000, "bearish", 350),
    (3, "appraiser_choi", 1_980_000_000, "neutral", 300),
    (4, "appraiser_kim", 3_180_000_000, "bullish", 550),
]


PROPERTIES_DATA = [
    {
        "broker_key": "broker_park",
        "title": "더 힐즈 모던 하우스", "title_en": "The Hills Modern",
        "category": "villa",
        "address": "서울특별시 용산구 한남동 123-45", "address_detail": "한남 더 힐즈 단지 내",
        "region_code": "11170", "lat": 37.534, "lng": 127.001,
        "price": 12_500_000_000, "area_m2": 245.8,
        "rooms": 5, "bathrooms": 4, "parking": 3, "build_year": 2023, "is_premium": True,
        "description": "대한민국 최고의 명품 주거 단지 '더 힐즈' 내에 위치한 최고급 모던 하우스입니다. 전 세대 남향 배치로 탁 트인 한강 조망권을 확보하고 있으며, 세계적인 건축 디자이너가 참여한 인테리어는 품격 있는 생활을 보장합니다.",
        "checklist": {"site_visit": True, "registry_verified": True, "remodeling_package": True},
        "images": [
            ("https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600", True),
            ("https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", False),
            ("https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800", False),
        ],
    },
    {
        "broker_key": "broker_lee",
        "title": "강남 헤리티지 펜트하우스", "title_en": "Gangnam Heritage Penthouse",
        "category": "apartment",
        "address": "서울특별시 강남구 삼성동 123-4", "address_detail": None,
        "region_code": "11680", "lat": 37.514, "lng": 127.058,
        "price": 4_500_000_000, "area_m2": 250.0,
        "rooms": 4, "bathrooms": 3, "parking": 2, "build_year": 2021, "is_premium": True,
        "description": "강남의 중심 삼성동에 위치한 펜트하우스. 최고의 조망권과 프라이버시를 보장합니다.",
        "checklist": {"site_visit": True, "registry_verified": True},
        "images": [("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600", True)],
    },
    {
        "broker_key": "broker_park",
        "title": "한남 시티뷰 펜트하우스", "title_en": None,
        "category": "apartment",
        "address": "서울특별시 용산구 한남동 456", "address_detail": None,
        "region_code": "11170", "lat": 37.535, "lng": 127.005,
        "price": 2_800_000_000, "area_m2": 112.0,
        "rooms": 3, "bathrooms": 2, "parking": 1, "build_year": 2020, "is_premium": False,
        "description": "한강뷰가 보이는 한남동 펜트하우스.",
        "checklist": {"site_visit": True},
        "images": [("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600", True)],
    },
    {
        "broker_key": "broker_lee",
        "title": "분당 자이 모던", "title_en": None,
        "category": "apartment",
        "address": "경기도 성남시 분당구 판교동", "address_detail": None,
        "region_code": "41135", "lat": 37.395, "lng": 127.111,
        "price": 1_950_000_000, "area_m2": 210.0,
        "rooms": 5, "bathrooms": 4, "parking": 2, "build_year": 2019, "is_premium": False,
        "description": "판교 신도시 중심부 대형 평형 아파트.",
        "checklist": {"site_visit": True, "registry_verified": True},
        "images": [("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600", True)],
    },
    {
        "broker_key": "broker_park",
        "title": "부산 시그니처 해운대", "title_en": None,
        "category": "apartment",
        "address": "부산광역시 해운대구 우동", "address_detail": None,
        "region_code": "26350", "lat": 35.158, "lng": 129.160,
        "price": 3_200_000_000, "area_m2": 148.0,
        "rooms": 3, "bathrooms": 2, "parking": 2, "build_year": 2022, "is_premium": True,
        "description": "해운대 오션뷰 시그니처 단지.",
        "checklist": {"site_visit": True, "registry_verified": True, "remodeling_package": True},
        "images": [("https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600", True)],
    },
    {
        "broker_key": "broker_lee",
        "title": "제주 서귀포 풀빌라", "title_en": None,
        "category": "detached",
        "address": "제주특별자치도 서귀포시 색달동", "address_detail": None,
        "region_code": "50130", "lat": 33.246, "lng": 126.412,
        "price": 1_200_000_000, "area_m2": 95.0,
        "rooms": 2, "bathrooms": 2, "parking": 2, "build_year": 2021, "is_premium": False,
        "description": "프라이빗 풀이 있는 단독 빌라.",
        "checklist": {"site_visit": True},
        "images": [("https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600", True)],
    },
]


async def main() -> None:
    async with SessionLocal() as session:
        # 0) 기존 데이터 삭제 (개발용)
        for table in [
            Payout, Transaction, ReviewPurchase, Payment, TokenTransaction, Wallet,
            TokenPackage, PurchaseIntent, Review, PropertyImage, Property,
            AppraiserProfile, BrokerProfile, UserRole, User,
        ]:
            await session.execute(delete(table))
        await session.flush()

        # 1) 토큰 패키지
        for pkg in TOKEN_PACKAGES:
            session.add(
                TokenPackage(
                    code=pkg["code"], name=pkg["name"], price_krw=pkg["price_krw"],
                    tokens=pkg["tokens"], bonus_tokens=pkg["bonus"],
                    is_active=True, sort_order=TOKEN_PACKAGES.index(pkg),
                    description=pkg["desc"],
                )
            )

        # 2) 사용자 + 역할 + 월렛
        user_map: dict[str, User] = {}
        for d in USERS_DATA:
            u = User(email=d["email"], password_hash=hash_password(d["password"]), name=d["name"])
            session.add(u)
            await session.flush()
            user_map[d["key"]] = u
            for role in d["roles"]:
                session.add(UserRole(user_id=u.id, role=role, created_at=NOW))
            session.add(Wallet(user_id=u.id, balance_tokens=0))

        # 매수자에게 초기 토큰 1,000별 충전 (데모)
        buyer = user_map["buyer"]
        buyer_wallet = (await session.execute(
            select(Wallet).where(Wallet.user_id == buyer.id)
        )).scalar_one()
        buyer_wallet.balance_tokens = 1_500
        buyer_wallet.total_charged = 1_500
        session.add(
            TokenTransaction(
                user_id=buyer.id, direction="in", type="charge",
                tokens=1_500, balance_after=1_500, memo="시드: 데모 초기 잔액",
            )
        )

        # 3) 프로필
        session.add(BrokerProfile(
            user_id=user_map["broker_park"].id, office_name="한남 더 힐 프리미엄 부동산",
            license_no="BR-2018-12345", office_address="서울특별시 용산구 한남대로 100",
            status="approved", approved_at=NOW,
        ))
        session.add(BrokerProfile(
            user_id=user_map["broker_lee"].id, office_name="강남 노블레스 부동산",
            license_no="BR-2019-99887", office_address="서울특별시 강남구 테헤란로 200",
            status="approved", approved_at=NOW,
        ))
        session.add(AppraiserProfile(
            user_id=user_map["appraiser_kim"].id, license_no="AP-2014-12345",
            license_image_url="https://placehold.co/600x400/png?text=License",
            years_of_experience=15, specialty="강남 지역 토지·빌딩",
            bio="강남 일대 15년 경력. 펜트하우스·하이엔드 빌라 전문.",
            status="approved", approved_at=NOW, approved_by=user_map["admin"].id,
        ))
        session.add(AppraiserProfile(
            user_id=user_map["appraiser_choi"].id, license_no="AP-2017-77777",
            license_image_url="https://placehold.co/600x400/png?text=License",
            years_of_experience=8, specialty="수익형 부동산·상가",
            bio="수익률 분석 중심의 정량 평가. 8년 경력.",
            status="approved", approved_at=NOW, approved_by=user_map["admin"].id,
        ))

        # 4) 매물 + 이미지
        properties: list[Property] = []
        for d in PROPERTIES_DATA:
            p = Property(
                broker_id=user_map[d["broker_key"]].id,
                title=d["title"], title_en=d["title_en"], category=d["category"],
                address=d["address"], address_detail=d["address_detail"],
                region_code=d["region_code"], latitude=d["lat"], longitude=d["lng"],
                price=d["price"], area_m2=d["area_m2"],
                rooms=d["rooms"], bathrooms=d["bathrooms"], parking=d["parking"],
                build_year=d["build_year"], description=d["description"],
                checklist=d["checklist"], status="active", is_premium=d["is_premium"],
            )
            session.add(p)
            await session.flush()
            for url, is_main in d["images"]:
                session.add(PropertyImage(
                    property_id=p.id, url=url, thumbnail_url=url,
                    sort_order=0 if is_main else 1, is_main=is_main,
                ))
            properties.append(p)

        # 5) 리뷰
        for prop_idx, appr_key, value, outlook, price in REVIEW_SEED:
            session.add(Review(
                property_id=properties[prop_idx].id,
                appraiser_id=user_map[appr_key].id,
                estimated_value=value, confidence_level="high",
                market_outlook=outlook,
                outlook_reason=(
                    "주변 개발 호재(GTX, 정비사업), 학군 수요, 한강 조망권을 종합한 의견. "
                    "최근 3년 거래 사례를 토대로 현재 호가 대비 적정 가치 산정."
                ),
                analysis_summary=(
                    "본 매물은 단지 내 최상층 라인에 위치하며 채광·전망·전용률 모두 우수. "
                    "리모델링 패키지가 포함되어 있어 추가 비용 절감 효과가 있음. "
                    "단, 거시 금리 인상 사이클이 마무리되기 전까지는 단기 변동성 유의."
                ),
                evidence_urls=[
                    "https://placehold.co/800x600/png?text=Evidence-1",
                    "https://placehold.co/800x600/png?text=Evidence-2",
                ],
                price=price, platform_fee_rate=0.150, disclaimer_field_visit=True,
                status="published", published_at=NOW,
                rating_avg=round(4.5 + (price % 5) * 0.1, 2),
                rating_count=10 + (price % 7),
            ))

        await session.commit()
        print(f"✅ Seeded:")
        print(f"   - users: {len(USERS_DATA)} (with wallets)")
        print(f"   - token packages: {len(TOKEN_PACKAGES)}")
        print(f"   - properties: {len(PROPERTIES_DATA)}")
        print(f"   - reviews: {len(REVIEW_SEED)}")
        print(f"   - buyer initial balance: 1,500 BYT (= ₩150,000)")


if __name__ == "__main__":
    asyncio.run(main())
