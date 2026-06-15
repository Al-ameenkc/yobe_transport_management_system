import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildPageHref, getTotalPages } from "@/lib/admin/pagination";

interface AdminPaginationProps {
  basePath: string;
  page: number;
  total: number;
  pageSize?: number;
  params?: Record<string, string | undefined>;
}

export function AdminPagination({
  basePath,
  page,
  total,
  pageSize = 10,
  params = {},
}: AdminPaginationProps) {
  const totalPages = getTotalPages(total, pageSize);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={buildPageHref(basePath, page - 1, params)}>
            <Button variant="outline" size="sm">
              Previous
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < totalPages ? (
          <Link href={buildPageHref(basePath, page + 1, params)}>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
