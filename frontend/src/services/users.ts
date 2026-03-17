import { api } from "./api";

export type UserRole = "ADMIN" | "TECNICO";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export async function listUsers() {
  const response = await api.get<User[]>("/users");
  return response.data;
}

export async function createUser(input: CreateUserInput) {
  const response = await api.post<User>("/users", input);
  return response.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}