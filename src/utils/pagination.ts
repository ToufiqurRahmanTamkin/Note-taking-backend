import { Request } from 'express';

export interface PageParams {
  page: number;
  limit: number;
  skip: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Parse `?page` and `?limit` from a request with sane defaults and hard caps
 * so a client can't request an unbounded page size.
 */
export const getPageParams = (req: Request): PageParams => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const rawLimit = Number(req.query.limit) || 10;
  const limit = Math.min(100, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** Wrap a page of results together with pagination metadata. */
export const buildPage = <T>(
  data: T[],
  total: number,
  { page, limit }: PageParams
): Paginated<T> => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
