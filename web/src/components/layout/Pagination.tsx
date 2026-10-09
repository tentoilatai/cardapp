import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { GlassSelect } from '../glass/GlassSelect';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  testId?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [20, 50, 100],
  testId,
}) => {
  const { isTouch } = useBreakpoint();

  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Mobile compact pagination variant
  if (isTouch) {
    const handleMobilePageChange = (newPage: number) => {
      onPageChange(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div
        data-testid={testId || 'pagination'}
        className="flex items-center justify-between w-full h-[48px] px-1 text-[0.75rem] leading-[1rem] font-medium text-[#68515E] dark:text-[#D8C9D2]"
      >
        <button
          type="button"
          onClick={() => handleMobilePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-[40px] min-w-[64px] px-3.5 rounded-full bg-white/80 dark:bg-white/10 border border-white/80 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed touch-target flex items-center gap-1.5 active:scale-95 transition-all text-[#2C1E26] dark:text-[#FFFFFF] text-[0.8125rem] leading-[1.125rem] font-medium"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75px]" />
          <span>Trước</span>
        </button>

        <span
          data-role="caption"
          className="tabular-nums font-medium text-[0.75rem] leading-[1rem] text-[#2C1E26] dark:text-[#FFFFFF] px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5"
        >
          Trang {currentPage} / {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={() => handleMobilePageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage >= safeTotalPages}
          className="h-[40px] min-w-[64px] px-3.5 rounded-full bg-white/80 dark:bg-white/10 border border-white/80 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed touch-target flex items-center gap-1.5 active:scale-95 transition-all text-[#2C1E26] dark:text-[#FFFFFF] text-[0.8125rem] leading-[1.125rem] font-medium"
        >
          <span>Sau</span>
          <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
        </button>
      </div>
    );
  }

  // Desktop standard pagination variant (pinned in Region D)
  return (
    <div
      data-testid={testId || 'pagination'}
      className="flex items-center justify-between w-full h-[48px] px-4 text-[0.75rem] leading-[1rem] font-normal text-[#68515E] dark:text-[#D8C9D2]"
    >
      {/* Left: Row count & page size select */}
      <div className="flex items-center gap-3">
        <span data-role="caption">
          Hiển thị <strong className="text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums font-medium">{startItem}–{endItem}</strong> trên <strong className="text-[#2C1E26] dark:text-[#FFFFFF] tabular-nums font-medium">{totalItems}</strong> dòng
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-black/10 dark:border-white/10">
            <span data-role="caption" className="text-[0.75rem] leading-[1rem] shrink-0">Số dòng:</span>
            <div className="w-20">
              <GlassSelect
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e?.target?.value ?? e))}
                size="sm"
                shape="pill"
                placement="top"
                searchable={false}
                options={pageSizeOptions.map((opt) => ({
                  value: opt,
                  label: `${opt}`
                }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right: Page navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[#2C1E26] dark:text-[#FFFFFF] transition-colors cursor-pointer"
          title="Trang đầu"
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4 stroke-[1.75px]" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[#2C1E26] dark:text-[#FFFFFF] transition-colors cursor-pointer"
          title="Trang trước"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75px]" />
        </button>

        <span className="px-3 py-1 rounded-full bg-[#E27AA1]/15 text-[#E27AA1] font-medium text-[0.8125rem] leading-[1.125rem] tabular-nums">
          {currentPage} / {safeTotalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage >= safeTotalPages}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[#2C1E26] dark:text-[#FFFFFF] transition-colors cursor-pointer"
          title="Trang sau"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage >= safeTotalPages}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-[#2C1E26] dark:text-[#FFFFFF] transition-colors cursor-pointer"
          title="Trang cuối"
          aria-label="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4 stroke-[1.75px]" />
        </button>
      </div>
    </div>
  );
};
