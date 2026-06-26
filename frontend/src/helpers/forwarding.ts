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
  const response = await fetch("/api/forward", {
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
  const response = await fetch(`/api/forward/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}

export async function addAlias(alias: string, email: string): Promise<any | null> {
  if (!alias || alias.trim() === "") {
    throw new Error("Alias email is required");
  }
  const response = await fetch("/api/alias", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alias,
      email,
    }),
  });

  return handleResponse(response);
}

export async function removeAlias(ruleId: number | undefined): Promise<any | null> {
  console.log("Removing alias rule with ID:", ruleId);
  if (!ruleId) return null;
  const response = await fetch(`/api/alias/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  return handleResponse(response);
}