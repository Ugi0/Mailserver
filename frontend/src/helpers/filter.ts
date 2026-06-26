import { handleResponse } from "./forwarding";

export async function addFilter(email: string, field: string, value: string, folder: string): Promise<any | null> {
  const response = await fetch("/api/rules/filter", {
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
  const response = await fetch(`/api/rules/filter/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}