"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "เล่นเกม" },
  { href: "/wallet", label: "กระเป๋า" },
  { href: "/how-it-works", label: "วิธีใช้งาน" },
];

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูหลัก" className="main-nav">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "nav-link nav-link-active" : "nav-link"}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
