"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logoHero from "@/public/logo-hero.png";
import GetTheApp from "@/components/GetTheApp";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  APP_LINKS_LIVE,
} from "@/lib/appstore";

export default function GetPage() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!APP_LINKS_LIVE) return;
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const target = isIOS ? APP_STORE_URL : isAndroid ? PLAY_STORE_URL : "";
    if (target) {
      setRedirecting(true);
      window.location.replace(target);
    }
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <Image src={logoHero} alt="" width={72} height={72} priority className="mb-6" />
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground">
        Get the Pro Audio Training Academy app
      </h1>
      <p className="mt-3 text-sm text-text-sub">
        {redirecting
          ? "Taking you to your app store…"
          : APP_LINKS_LIVE
            ? "Choose your platform below to download the app and create your account."
            : "Accounts are created in the app. Store listings are not live yet — ask to be notified if you want a note when they are."}
      </p>

      <GetTheApp className="mt-8 w-full text-left" />
    </div>
  );
}
