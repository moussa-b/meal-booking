"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UrlCleanerProps {
  param: string;
}

export function AdminMenusUrlCleaner({ param }: UrlCleanerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const value = searchParams.get(param);
    if (!value) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete(param);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.replace(url, { scroll: false });
  }, [param, router, pathname, searchParams]);

  return null;
}

