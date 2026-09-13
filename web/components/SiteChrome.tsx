"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Footer from "./Footer";
import { isConnectPath } from "@/lib/connect";

/** Public chrome. Hidden on /connect so the invitation page has no site nav. */
export function SiteHeader() {
  const pathname = usePathname();
  if (isConnectPath(pathname)) return null;
  return <Nav />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (isConnectPath(pathname)) return null;
  return <Footer />;
}
