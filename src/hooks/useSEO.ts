import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/TRfEiSXEKjb49MMpABtkIBhKTEG2/social-images/social-1772747178383-3009.webp";
const BASE_URL = "https://fishkillerz.lovable.app";

/**
 * useSEO — updates document title, meta description, canonical,
 * og: and twitter: tags dynamically on every route change.
 *
 * Pass `jsonLd` (single object or array) to inject route-scoped
 * <script type="application/ld+json"> tags. They are removed on unmount.
 */
export function useSEO({ title, description, canonical, ogImage, jsonLd }: SEOProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const match = selector.match(/\[(.+?)="(.+?)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : `${BASE_URL}/`;
    const image = ogImage || DEFAULT_IMAGE;

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', image);

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    const ldNodes: HTMLScriptElement[] = [];
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      for (const item of items) {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.dataset.routeSeo = "true";
        s.textContent = JSON.stringify(item);
        document.head.appendChild(s);
        ldNodes.push(s);
      }
    }

    return () => {
      ldNodes.forEach((n) => n.remove());
    };
  }, [title, description, canonical, ogImage, JSON.stringify(jsonLd ?? null)]);
}
