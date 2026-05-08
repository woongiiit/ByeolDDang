from typing import Literal

from pydantic import BaseModel, Field

PropertyCategory = Literal["apartment", "villa", "detached", "officetel", "commercial", "land"]
PropertyStatus = Literal["draft", "active", "sold", "withdrawn"]


class PropertyImageOut(BaseModel):
    id: str
    url: str
    thumbnail_url: str | None = None
    is_main: bool = False
    sort_order: int = 0


class PropertyBrokerOut(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    office_name: str | None = None


class PropertyReviewSummary(BaseModel):
    count: int
    min_price: int | None
    max_price: int | None
    avg_rating: float | None


class PropertyListItem(BaseModel):
    id: str
    title: str
    category: PropertyCategory
    address: str
    price: int
    area_m2: float
    rooms: int | None
    bathrooms: int | None
    is_premium: bool
    main_image_url: str | None
    rating_avg: float
    review_count: int


class PropertyDetail(BaseModel):
    id: str
    title: str
    title_en: str | None
    category: PropertyCategory
    address: str
    address_detail: str | None
    region_code: str
    latitude: float | None
    longitude: float | None
    price: int
    area_m2: float
    area_pyeong: int
    rooms: int | None
    bathrooms: int | None
    parking: int | None
    build_year: int | None
    description: str | None
    checklist: dict
    status: PropertyStatus
    is_premium: bool
    images: list[PropertyImageOut]
    broker: PropertyBrokerOut
    reviews_summary: PropertyReviewSummary


class PropertyCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    title_en: str | None = None
    category: PropertyCategory
    address: str
    address_detail: str | None = None
    region_code: str
    latitude: float | None = None
    longitude: float | None = None
    price: int = Field(ge=0)
    area_m2: float = Field(gt=0)
    rooms: int | None = None
    bathrooms: int | None = None
    parking: int | None = None
    build_year: int | None = None
    description: str | None = None
    checklist: dict = Field(default_factory=dict)
