export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ResponseDto<T> {
  message: string;
  data: T;
  meta?: PaginationMeta;
}
