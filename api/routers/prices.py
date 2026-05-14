from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import schemas
from database import get_db
from models import PriceRecord, Product

router = APIRouter(prefix="/prices", tags=["prices"])


@router.post("/", response_model=schemas.PriceRecord, status_code=201)
async def record_price(
    payload: schemas.PriceRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product).where(Product.id == payload.product_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump()
    if data.get("checked_at") is None:
        data["checked_at"] = datetime.now(timezone.utc)

    record = PriceRecord(**data)
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
