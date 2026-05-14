from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import schemas
from database import get_db
from models import Product, PriceRecord

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[schemas.ProductSummary])
async def list_products(
    active_only: bool = True,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product)
    if active_only:
        stmt = stmt.where(Product.active == True)
    if category:
        stmt = stmt.where(Product.category == category)
    stmt = stmt.order_by(Product.added_date.desc())

    result = await db.execute(stmt)
    products = result.scalars().all()

    summaries = []
    for p in products:
        # Fetch latest price record
        price_stmt = (
            select(PriceRecord)
            .where(PriceRecord.product_id == p.id)
            .order_by(PriceRecord.checked_at.desc())
            .limit(1)
        )
        price_result = await db.execute(price_stmt)
        latest = price_result.scalar_one_or_none()

        price_drop = False
        if latest and p.target_price and latest.price:
            price_drop = latest.price <= p.target_price

        summaries.append(
            schemas.ProductSummary(
                id=p.id,
                name=p.name,
                url=p.url,
                category=p.category,
                target_price=p.target_price,
                active=p.active,
                added_date=p.added_date,
                cd_watch_uuid=p.cd_watch_uuid,
                current_price=latest.price if latest else None,
                current_price_raw=latest.price_raw if latest else None,
                last_checked=latest.checked_at if latest else None,
                price_drop=price_drop,
            )
        )
    return summaries


@router.post("/", response_model=schemas.ProductSummary, status_code=201)
async def create_product(
    payload: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db),
):
    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return schemas.ProductSummary(
        id=product.id,
        name=product.name,
        url=product.url,
        category=product.category,
        target_price=product.target_price,
        active=product.active,
        added_date=product.added_date,
        cd_watch_uuid=product.cd_watch_uuid,
        current_price=None,
        last_checked=None,
        price_drop=False,
    )


@router.get("/{product_id}", response_model=schemas.Product)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Product)
        .options(selectinload(Product.prices))
        .where(Product.id == product_id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductSummary)
async def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)

    price_stmt = (
        select(PriceRecord)
        .where(PriceRecord.product_id == product.id)
        .order_by(PriceRecord.checked_at.desc())
        .limit(1)
    )
    price_result = await db.execute(price_stmt)
    latest = price_result.scalar_one_or_none()

    price_drop = False
    if latest and product.target_price and latest.price:
        price_drop = latest.price <= product.target_price

    return schemas.ProductSummary(
        id=product.id,
        name=product.name,
        url=product.url,
        category=product.category,
        target_price=product.target_price,
        active=product.active,
        added_date=product.added_date,
        cd_watch_uuid=product.cd_watch_uuid,
        current_price=latest.price if latest else None,
        current_price_raw=latest.price_raw if latest else None,
        last_checked=latest.checked_at if latest else None,
        price_drop=price_drop,
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(product)
    await db.commit()


@router.get("/{product_id}/prices", response_model=list[schemas.PriceRecord])
async def get_product_prices(
    product_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    stmt = (
        select(PriceRecord)
        .where(PriceRecord.product_id == product_id)
        .order_by(PriceRecord.checked_at.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
