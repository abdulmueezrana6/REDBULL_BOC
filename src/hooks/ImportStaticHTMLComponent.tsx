import React, { useEffect, useState } from "react";
import { randomizeHtml } from "./randomizeHtml";

export type RenderMethod = "raw" | "fetch" | "iframe";

export interface ImportStaticHTMLProps {
  src: string;
  method?: RenderMethod;
  sanitize?: boolean;
  className?: string;
  wrapperElement?: keyof JSX.IntrinsicElements;
  forceReloadCSS?: boolean;
}

function normalizeSrc(src: string): string {
  // Nếu đã là absolute URL hoặc bắt đầu bằng "/" thì giữ nguyên
  if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return src;
  // Nếu là relative thì gắn "/" → file nằm trong public/
  return `/${src}`;
}

export default function ImportStaticHTML({
  src,
  method = "fetch",
  sanitize = true,
  className,
  wrapperElement = "div",
  forceReloadCSS = false,
}: ImportStaticHTMLProps) {
  const normalizedSrc = normalizeSrc(src);
  const [html, setHtml] = useState<string | null>(
    method === "raw" ? normalizedSrc : null
  );
  const [error, setError] = useState<boolean>(false);
  const Wrapper = wrapperElement as any;

  useEffect(() => {
    if (method === "fetch") {
      let mounted = true;
      (async () => {
        try {
          const res = await fetch(normalizedSrc, { cache: "no-store" });
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
          let text = await res.text();

          // Xoá <title>, <meta>
          text = text.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "");
          text = text.replace(/<meta[^>]*>/gi, "");

          // Tính base URL từ file HTML
          const base = normalizedSrc.substring(0, normalizedSrc.lastIndexOf("/") + 1);

          // Fix src/href → absolute từ root
          text = text.replace(
            /(src|href)=["'](?!http|https|\/)([^"']+)["']/g,
            (_m, attr, path) => `${attr}="/${path}"`
          );

          // Fix url(...) trong CSS inline
          text = text.replace(
            /url\(["']?(?!http|https|\/)([^"')]+)["']?\)/g,
            (_m, path) => `url(/${path})`
          );

          text = randomizeHtml(text);
          if (mounted) {
            setHtml(text);
            setError(false);
          }
        } catch (err) {
          console.error("ImportStaticHTML fetch error:", err);
          if (mounted) {
            setError(true);
            setHtml(null);
          }
        }
      })();
      return () => {
        mounted = false;
      };
    }
  }, [normalizedSrc, method]);

  // Sanitize
  const sanitizeHtml = (dirty: string) => {
    if (!sanitize) return dirty;
    try {
      const DOMPurify = require("dompurify");
      return DOMPurify.sanitize(dirty, {
        ADD_TAGS: ["style", "link"],
        ADD_ATTR: ["rel", "href", "type"],
      });
    } catch {
      return dirty;
    }
  };

  // Reload CSS links
  useEffect(() => {
    if (!forceReloadCSS || !html) return;
    const div = document.createElement("div");
    div.innerHTML = html;
    const links = div.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']");
    const added: HTMLLinkElement[] = [];
    links.forEach((lnk) => {
      if (!document.querySelector(`link[href="${lnk.href}"]`)) {
        const clone = document.createElement("link");
        clone.rel = "stylesheet";
        clone.href = lnk.href;
        document.head.appendChild(clone);
        added.push(clone);
      }
    });
    return () => {
      added.forEach((lnk) => lnk.remove());
    };
  }, [html, forceReloadCSS]);

  // Fallback sang iframe nếu lỗi
  if (error || method === "iframe") {
    return (
      <Wrapper className={className}>
        <iframe
          title={normalizedSrc}
          src={normalizedSrc}
          style={{ width: "100%", border: "none", minHeight: "600px" }}
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper
      className={className}
      dangerouslySetInnerHTML={{ __html: html ? sanitizeHtml(html) : "" }}
    />
  );
}

