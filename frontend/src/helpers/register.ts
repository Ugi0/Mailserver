export async function validateRegistryCode(code: string): Promise<boolean> {
  const path = "/api/registration-code";
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: code }),
  });
  return response.ok;
}

export async function validateLoginCredentials(username: string, password: string): Promise<string> {
  const path = "/api/users/ensure-free";
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username, password: password }),
  });
  if (!response.ok) {
    return response.text();
  }
  return "";
}

export async function createAccount(username: string, password: string, registrationCode: string): Promise<boolean> {
  const path = "/api/users/create";
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username, password: password, registrationCode: registrationCode }),
  });
  if (!response.ok) {
    return false;
  }
  return true;
}

export async function agreeToTerms(): Promise<boolean> {
  const path = "/api/users/agree-terms";
  const response = await fetch(path, {
    method: "POST"
  });
  return response.ok;
}