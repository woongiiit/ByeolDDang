import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      ["Marketplace", "/"],
      ["Appraisals", "/appraiser"],
      ["Finances", "/transactions"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Help Center", "/legal/help"],
      ["Broker Guide", "/legal/broker"],
      ["Appraiser Portal", "/appraiser"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Privacy Policy", "/legal/privacy"],
      ["Terms of Service", "/legal/terms"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-page gap-8 px-6 py-12 md:grid-cols-[1fr_auto_auto_auto] md:gap-16">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="별땅"
              width={120}
              height={28}
              className="h-7 w-auto object-contain object-left"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm text-text-muted">
            전문 감정평가사의 검증된 리뷰로 매수자·중개사·평가사가 함께 성장하는
            프리미엄 부동산 마켓플레이스.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-text">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} 별땅 (ByeolDDang). All rights reserved.
      </div>
    </footer>
  );
}
