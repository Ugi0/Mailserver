export async function checkCredentials(username: string, password: string): Promise<{ agreedToTerms: boolean } | null> {
  const path = "/api/users/authorize";
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username, password: password }),
  });

  if (response.ok) {
    const userData = await response.json();
    return userData;
  }

  return null;
}
