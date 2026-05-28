const BASE_URL = "https://jsonplaceholder.typicode.com/users";

export async function fetchUsers() {
  const response = await fetch(BASE_URL);
  if (!response.ok) throw new Error(`fetchUsers failed: ${response.status}`);
  return response.json();
}

export async function createUser(user) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error(`createUser failed: ${response.status}`);
  return response.json();
}

export async function updateUser(id, user) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error(`updateUser failed: ${response.status}`);
  return response.json();
}

export async function deleteUser(id) {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`deleteUser failed: ${response.status}`);
  return { id };
}
