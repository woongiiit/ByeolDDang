from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFound
from app.models.payment import Payout, Transaction
from app.models.user import AppraiserProfile, BrokerProfile, User
from app.schemas.admin import AppraiserApplicationOut, BrokerApplicationOut


async def list_appraisers(
    session: AsyncSession, status: str | None = None
) -> list[AppraiserApplicationOut]:
    q = select(AppraiserProfile, User).join(User, User.id == AppraiserProfile.user_id)
    if status:
        q = q.where(AppraiserProfile.status == status)
    rows = (await session.execute(q.order_by(User.created_at.desc()))).all()
    return [
        AppraiserApplicationOut(
            user_id=str(p.user_id),
            name=u.name,
            email=u.email,
            license_no=p.license_no,
            license_image_url=p.license_image_url,
            years_of_experience=p.years_of_experience,
            specialty=p.specialty,
            bio=p.bio,
            status=p.status,  # type: ignore[arg-type]
            rejection_reason=p.rejection_reason,
            approved_at=p.approved_at,
        )
        for p, u in rows
    ]


async def list_brokers(
    session: AsyncSession, status: str | None = None
) -> list[BrokerApplicationOut]:
    q = select(BrokerProfile, User).join(User, User.id == BrokerProfile.user_id)
    if status:
        q = q.where(BrokerProfile.status == status)
    rows = (await session.execute(q.order_by(User.created_at.desc()))).all()
    return [
        BrokerApplicationOut(
            user_id=str(p.user_id),
            name=u.name,
            email=u.email,
            office_name=p.office_name,
            license_no=p.license_no,
            office_address=p.office_address,
            status=p.status,  # type: ignore[arg-type]
            approved_at=p.approved_at,
        )
        for p, u in rows
    ]


async def approve_appraiser(session: AsyncSession, user_id: str, admin_id: str) -> None:
    profile = (
        await session.execute(
            select(AppraiserProfile).where(AppraiserProfile.user_id == user_id)
        )
    ).scalar_one_or_none()
    if not profile:
        raise NotFound("Appraiser profile not found")
    profile.status = "approved"
    profile.approved_at = datetime.now(UTC)
    profile.approved_by = admin_id  # type: ignore[assignment]
    profile.rejection_reason = None
    await session.commit()


async def reject_appraiser(
    session: AsyncSession, user_id: str, reason: str
) -> None:
    profile = (
        await session.execute(
            select(AppraiserProfile).where(AppraiserProfile.user_id == user_id)
        )
    ).scalar_one_or_none()
    if not profile:
        raise NotFound("Appraiser profile not found")
    profile.status = "rejected"
    profile.rejection_reason = reason
    await session.commit()


async def approve_broker(session: AsyncSession, user_id: str) -> None:
    profile = (
        await session.execute(select(BrokerProfile).where(BrokerProfile.user_id == user_id))
    ).scalar_one_or_none()
    if not profile:
        raise NotFound("Broker profile not found")
    profile.status = "approved"
    profile.approved_at = datetime.now(UTC)
    await session.commit()


async def list_pending_transactions(session: AsyncSession) -> list[Transaction]:
    return list(
        (
            await session.execute(
                select(Transaction).where(Transaction.status == "reported")
            )
        ).scalars().all()
    )


async def verify_transaction(
    session: AsyncSession, transaction_id: str, admin_id: str
) -> Transaction:
    tx = (
        await session.execute(select(Transaction).where(Transaction.id == transaction_id))
    ).scalar_one_or_none()
    if not tx:
        raise NotFound("Transaction not found")
    tx.status = "verified"
    tx.verified_at = datetime.now(UTC)
    tx.verified_by = admin_id  # type: ignore[assignment]

    now = datetime.now(UTC)
    session.add_all(
        [
            Payout(
                transaction_id=tx.id,
                recipient_id=tx.broker_id,
                recipient_role="broker",
                label="에이전트 중개 수수료",
                amount=tx.broker_fee,
                status="pending",
                created_at=now,
            ),
            Payout(
                transaction_id=tx.id,
                recipient_id=tx.broker_id,  # 플랫폼 wallet은 시스템 사용자 분리 필요. MVP는 동일.
                recipient_role="platform",
                label="별땅 거래 중개 플랫폼 수수료",
                amount=tx.platform_fee,
                status="pending",
                created_at=now,
            ),
        ]
    )
    await session.commit()
    return tx
