import { handleResponse } from "./forwarding";

export async function setAutoReply(email: string, subject: string, message: string, days: number = 1): Promise<any | null> {
  const response = await fetch("/api/autoreply", {
    method: "POST",
        
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      subject,
      message,
      days,
    }),
  });

  return handleResponse(response);
}

export async function removeAutoReply(ruleId: number): Promise<any | null> {
  const response = await fetch(`/api/autoreply/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}