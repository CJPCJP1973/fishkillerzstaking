import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/TRfEiSXEKjb49MMpABtkIBhKTEG2/social-images/social-1772747178383-3009.webp";
const BASE_URL = "https://fishkillerz.com";

/**
 * useSEO — updates document title, meta description, canonical,
 * og: and twitter: tags dynamically on every route change.
 *
 * Usage:
 *   useSEO({ title: "Page Title", description: "...", canonical: "/path" });
 */
export function useSEO({ title, description, canonical, ogImage }: SEOProps) {
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
  }, [title, description, canonical, ogImage]);
}
