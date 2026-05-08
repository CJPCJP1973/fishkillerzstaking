import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import CryptoStakingGuide from "@/pages/CryptoStakingGuide";
import OurStakingServices from "@/pages/OurStakingServices";

// Stub Supabase client to avoid network during render
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: vi.fn() }) }),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

const renderRoute = (path: string, element: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Pillar pages", () => {
  it("renders /crypto-staking-guide with its H1", () => {
    renderRoute("/crypto-staking-guide", <CryptoStakingGuide />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Complete Crypto Staking Guide/i })
    ).toBeInTheDocument();
  });

  it("renders /our-staking-services with its H1", () => {
    renderRoute("/our-staking-services", <OurStakingServices />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Crypto-Backed Poker Staking/i })
    ).toBeInTheDocument();
  });
});

describe("sitemap.xml", () => {
  const sitemapPath = resolve(process.cwd(), "public/sitemap.xml");

  it("exists", () => {
    expect(existsSync(sitemapPath)).toBe(true);
  });

  const xml = existsSync(sitemapPath) ? readFileSync(sitemapPath, "utf8") : "";

  it("includes /crypto-staking-guide", () => {
    expect(xml).toMatch(/<loc>[^<]*\/crypto-staking-guide<\/loc>/);
  });

  it("includes /our-staking-services", () => {
    expect(xml).toMatch(/<loc>[^<]*\/our-staking-services<\/loc>/);
  });
});
