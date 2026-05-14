from datetime import datetime
from pydantic import BaseModel, HttpUrl


class PriceRecordBase(BaseModel):
    price: float | None = None
    price_raw: str | None = None
    currency: str = "EUR"
    in_stock: bool = True


class PriceRecordCreate(PriceRecordBase):
    product_id: int
    checked_at: datetime | None = None


class PriceRecord(PriceRecordBase):
    id: int
    product_id: int
    checked_at: datetime

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str
    url: str
    category: str | None = None
    target_price: float | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    category: str | None = None
    target_price: float | None = None
    active: bool | None = None


class ProductSummary(ProductBase):
    id: int
    active: bool
    added_date: datetime
    cd_watch_uuid: str | None = None
    current_price: float | None = None
    current_price_raw: str | None = None
    last_checked: datetime | None = None
    price_drop: bool = False

    model_config = {"from_attributes": True}


class Product(ProductBase):
    id: int
    active: bool
    added_date: datetime
    cd_watch_uuid: str | None = None
    prices: list[PriceRecord] = []

    model_config = {"from_attributes": True}
