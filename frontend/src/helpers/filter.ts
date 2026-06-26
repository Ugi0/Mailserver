import { handleResponse } from "./forwarding";

export async function addFilter(email: string, field: string, value: string, folder: string): Promise<any | null> {
  const response = await fetch("/api/filter", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      field,
      value,
      folder,
    }),
  });

  return handleResponse(response);
}

export async function removeFilter(ruleId: number): Promise<any | null> {
  const response = await fetch(`/api/filter/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}

export async function toggleRule(id: number, enabled: boolean, setRules: React.Dispatch<React.SetStateAction<ForwardingRule[]>>) {
  setRules((prev: ForwardingRule[]) =>
    prev.map((r) =>
      r.id === id ? { ...r, enabled } : r
    )
  );

  await fetch(`/api/forward/${id}/toggle`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
}

export type ForwardingRule = {
  id: number;
  destination_email: string;
  enabled: boolean;
}