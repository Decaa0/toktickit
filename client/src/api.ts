export interface Category {
  id: number;
  name: string;
}

export interface CheckSystemResponse {
  status: string;
  service: string;
  categories: Category[];
}

export async function checkSystem(): Promise<CheckSystemResponse> {
  const [healthRes, categoriesRes] = await Promise.all([
    fetch("/api/health"),
    fetch("/api/categories"),
  ]);

  if (!healthRes.ok || !categoriesRes.ok) {
    throw new Error("System check failed");
  }

  const health = await healthRes.json();
  const categories = await categoriesRes.json();

  return {
    ...health,
    categories,
  };
}