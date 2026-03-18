"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type RequiredMarkProps = {
  className?: string
}

export function RequiredMark({ className }: RequiredMarkProps) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn("text-muted-foreground", className)}
      >
        *
      </span>
      <span className="sr-only">(requis)</span>
    </>
  )
}

