"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type SiteNavLinksProps = {
  homeLabel: string;
  predictionsLabel: string;
  vipLabel: string;
};

export default function SiteNavLinks({
  homeLabel,
  predictionsLabel,
  vipLabel,
}: SiteNavLinksProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => {
      setHash(window.location.hash);
    };

    updateHash();

    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, [pathname]);

  const homeActive = pathname === "/" && hash !== "#predictions";
  const predictionsActive = pathname === "/" && hash === "#predictions";
  const vipActive = pathname === "/subscribe";

  const linkClass = (active: boolean) =>
    [
      "text-sm font-bold transition",
      active
        ? "text-brand"
        : "text-text-secondary hover:text-brand",
    ].join(" ");

  return (
    <nav className="hidden items-center gap-7 lg:flex">
      <a href="/" className={linkClass(homeActive)}>
        {homeLabel}
      </a>

      <a
        href="/#predictions"
        className={linkClass(predictionsActive)}
      >
        {predictionsLabel}
      </a>

      <a
        href="/subscribe"
        className={linkClass(vipActive)}
      >
        {vipLabel}
      </a>
    </nav>
  );
}

