"use client";

import { HydrationBoundary, DehydratedState } from "@tanstack/react-query";

export default function HydrateClient({
  state,
  children,
}: {
  state: DehydratedState;
  children: React.ReactNode;
}) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
