import type { FilterRule } from "../types/filterRule";
import { handleResponse } from "./forwarding";

export async function addFilter(email: string, rule: FilterRule): Promise<any | null> {
  const response = await fetch("/api/filter", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      rule,
    }),
  });

  return handleResponse(response);
}

export async function updateFilter(id: number, email: string, rule: FilterRule) {
  const res = await fetch(`/api/filter/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, rule }),
  });

  return handleResponse(res);
}

export async function removeFilter(ruleId: number): Promise<any | null> {
  const response = await fetch(`/api/filter/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}

export async function toggleRule(id: number, enabled: boolean) {

  await fetch(`/api/filter/${id}/toggle`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
}