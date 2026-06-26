export async function handleResponse<T>(response: Response): Promise<T | null> {
  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }
}

export async function addForwarding(email: string, forwardTo: string): Promise<any | null> {
  if (!forwardTo || forwardTo.trim() === "") {
    throw new Error("Forwarding email is required");
  }
  const response = await fetch("/api/rules/forward", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      forwardTo,
    }),
  });

  return handleResponse(response);
}

export async function removeForwarding(ruleId: number | undefined): Promise<any | null> {
  console.log("Removing forwarding rule with ID:", ruleId);
  if (!ruleId) return null;
  const response = await fetch(`/api/rules/forward/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}