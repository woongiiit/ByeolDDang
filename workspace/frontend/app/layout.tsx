import type { Metadata } from "next";
import "@/styles/globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const siteName = "별땅";
const longTitle = `${siteName} - 검증된 가치를 찾는 부동산 마켓플레이스`;
const description =
  "전문 감정평가사의 유료 리뷰를 통해 정확한 미래 가치와 객관적인 시세를 확인하세요.";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description,
  openGraph: {
    title: longTitle,
    description,
    siteName,
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: longTitle,
    description,
  },
  // favicon / apple-touch-icon: app/icon.png, app/apple-icon.png (정사각형·비율 유지)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
