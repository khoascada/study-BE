import { PAGINATION } from "@/constants";

export type PaginationQuery = {
  page?: string;
  limit?: string;
  sort?: string; // format: "field:asc" | "field:desc"
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ParsedPagination = {
  skip: number;
  take: number;
  page: number;
  orderBy?: Record<string, "asc" | "desc">;
};

export const parsePagination = (query: PaginationQuery, allowedSortFields: string[] = []): ParsedPagination => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number(query.limit) || PAGINATION.DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  let orderBy: Record<string, "asc" | "desc"> | undefined;
  if (query.sort) {
    const [field, dir] = query.sort.split(":");
    if (allowedSortFields.includes(field)) {
      orderBy = { [field]: dir === "desc" ? "desc" : "asc" };
    }
  }

  return { skip, take: limit, page, orderBy };
};

export const buildMeta = (total: number, page: number, limit: number): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
