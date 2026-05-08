"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProperty } from "@/features/properties/api";
import { extractError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

const CATEGORIES = [
  { key: "apartment", label: "아파트" },
  { key: "villa", label: "빌라" },
  { key: "detached", label: "단독주택" },
  { key: "officetel", label: "오피스텔" },
  { key: "commercial", label: "상가·사무실" },
  { key: "land", label: "토지" },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    title: "",
    title_en: "",
    category: "apartment",
    address: "",
    address_detail: "",
    region_code: "",
    price: 0,
    area_m2: 0,
    rooms: 0,
    bathrooms: 0,
    parking: 0,
    build_year: 0,
    description: "",
    site_visit: false,
    registry_verified: false,
    remodeling_package: false,
    main_image_url: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="card grid place-items-center p-12 text-center">
          <p>로그인이 필요합니다.</p>
          <Link href="/auth/login" className="mt-4"><Button>로그인</Button></Link>
        </div>
      </div>
    );
  }
  if (!user.roles.includes("broker")) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="card p-12 text-center text-sm text-text-muted">
          중개사 권한이 필요합니다.
        </div>
      </div>
    );
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await createProperty({
        title: form.title,
        title_en: form.title_en || undefined,
        category: form.category,
        address: form.address,
        address_detail: form.address_detail || undefined,
        region_code: form.region_code,
        price: form.price,
        area_m2: form.area_m2,
        rooms: form.rooms || undefined,
        bathrooms: form.bathrooms || undefined,
        parking: form.parking || undefined,
        build_year: form.build_year || undefined,
        description: form.description || undefined,
        checklist: {
          site_visit: form.site_visit,
          registry_verified: form.registry_verified,
          remodeling_package: form.remodeling_package,
        },
      });
      // 메인 이미지 URL이 있으면 등록
      if (form.main_image_url) {
        try {
          const { apiClient } = await import("@/lib/api");
          await apiClient.post(`/properties/${res.id}/images`, {
            url: form.main_image_url,
            is_main: true,
          });
        } catch {
          // ignore image errors
        }
      }
      router.push(`/properties/${res.id}`);
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">매물 등록</h1>
      <p className="mt-1 text-sm text-text-muted">고객 노출에 필수적인 항목을 채워주세요.</p>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <Section title="기본 정보">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel label="매물명 (한글)" required>
              <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
            </FieldLabel>
            <FieldLabel label="매물명 (영문, 선택)">
              <Input value={form.title_en} onChange={(e) => set("title_en", e.target.value)} />
            </FieldLabel>
            <FieldLabel label="카테고리" required>
              <select
                required
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="행정구역 코드 (5자리)" required>
              <Input
                required
                pattern="[0-9]{5}"
                value={form.region_code}
                onChange={(e) => set("region_code", e.target.value)}
                placeholder="예: 11170 (용산구)"
              />
            </FieldLabel>
          </div>
          <FieldLabel label="주소" required>
            <Input required value={form.address} onChange={(e) => set("address", e.target.value)} />
          </FieldLabel>
          <FieldLabel label="상세 주소 (선택)">
            <Input value={form.address_detail} onChange={(e) => set("address_detail", e.target.value)} />
          </FieldLabel>
        </Section>

        <Section title="규모와 가격">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldLabel label="호가 (원)" required>
              <Input
                required
                type="number"
                min={0}
                value={form.price || ""}
                onChange={(e) => set("price", Number(e.target.value))}
              />
            </FieldLabel>
            <FieldLabel label="전용면적 (m²)" required>
              <Input
                required
                type="number"
                min={1}
                step={0.1}
                value={form.area_m2 || ""}
                onChange={(e) => set("area_m2", Number(e.target.value))}
              />
            </FieldLabel>
            <FieldLabel label="준공 연도">
              <Input
                type="number"
                value={form.build_year || ""}
                onChange={(e) => set("build_year", Number(e.target.value))}
                placeholder="예: 2023"
              />
            </FieldLabel>
            <FieldLabel label="침실 수">
              <Input type="number" min={0} value={form.rooms || ""} onChange={(e) => set("rooms", Number(e.target.value))} />
            </FieldLabel>
            <FieldLabel label="욕실 수">
              <Input type="number" min={0} value={form.bathrooms || ""} onChange={(e) => set("bathrooms", Number(e.target.value))} />
            </FieldLabel>
            <FieldLabel label="주차 대수">
              <Input type="number" min={0} value={form.parking || ""} onChange={(e) => set("parking", Number(e.target.value))} />
            </FieldLabel>
          </div>
        </Section>

        <Section title="상세 설명">
          <textarea
            rows={6}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="입지·구조·설비·주변 환경 등 매수자에게 도움될 정보를 자세히 적어주세요."
            className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary focus:outline-none"
          />
        </Section>

        <Section title="신뢰도 체크리스트">
          <div className="grid gap-2 sm:grid-cols-3">
            <Checkbox label="현장 답사 완료" value={form.site_visit} onChange={(v) => set("site_visit", v)} />
            <Checkbox label="등기부등본 확인" value={form.registry_verified} onChange={(v) => set("registry_verified", v)} />
            <Checkbox label="리모델링 패키지" value={form.remodeling_package} onChange={(v) => set("remodeling_package", v)} />
          </div>
        </Section>

        <Section title="대표 이미지 (선택)">
          <FieldLabel label="이미지 URL">
            <Input
              value={form.main_image_url}
              onChange={(e) => set("main_image_url", e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </FieldLabel>
          <p className="text-xs text-text-muted">MVP는 외부 URL만 지원합니다. S3 직접 업로드는 Phase 2.</p>
        </Section>

        {error && <p className="text-sm text-accent-red">{error}</p>}

        <div className="flex justify-end gap-2">
          <Link href="/broker">
            <Button type="button" variant="secondary">취소</Button>
          </Link>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "등록 중…" : "매물 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FieldLabel({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm">
        {label} {required && <span className="text-accent-red">*</span>}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}
