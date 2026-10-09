import React from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { GlassSelect } from './GlassSelect';

export interface GlassPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export const GlassPagination: React.FC<GlassPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
  itemLabel = 'mục',
  className,
}) => {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(safeTotalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < safeTotalPages - 2) {
        pages.push('...');
      }
      pages.push(safeTotalPages);
    }
    return pages;
  };

  return (
    <div
      className={clsx(
        'p-3 sm:px-4 sm:py-2.5 bg-transparent',
        'border-t border-[#E5E7EB] dark:border-[#262634]',
        'flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] leading-[16px] text-[#68515E] dark:text-[#D8C9D2]',
        className
      )}
    >
      {/* Left: Summary text & Page size selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div data-role="caption" className="font-normal text-[#68515E] dark:text-[#D8C9D2] whitespace-nowrap text-[12px] leading-[16px]">
          Hiển thị <strong className="text-[#2C1E26] dark:text-[#FFFFFF] font-medium tabular-nums">{startItem}</strong> - <strong className="text-[#2C1E26] dark:text-[#FFFFFF] font-medium tabular-nums">{endItem}</strong> / <strong className="text-[#2C1E26] dark:text-[#FFFFFF] font-medium tabular-nums">{totalItems}</strong> {itemLabel}
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span data-role="caption" className="text-[12px] leading-[16px] text-[#68515E] dark:text-[#D8C9D2] hidden md:inline">Số dòng:</span>
            <div className="w-24">
              <GlassSelect
                value={pageSize}
                onChange={(val) => {
                  onPageSizeChange(Number(val));
                  onPageChange(1);
                }}
                options={pageSizeOptions.map(size => ({
                  value: size,
                  label: `${size} / trang`
                }))}
                size="sm"
                triggerClassName="min-h-[32px] py-1 px-2.5 text-[12px] bg-white dark:bg-[#1E1E2A]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* First Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'border border-[#E5E7EB] dark:border-[#262634] bg-white dark:bg-[#1E1E2A] hover:bg-gray-50 dark:hover:bg-[#252535] text-[#2C1E26] dark:text-[#FFFFFF] shadow-2xs',
            'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none'
          )}
          title="Trang đầu"
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4 stroke-[1.75px]" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'border border-[#E5E7EB] dark:border-[#262634] bg-white dark:bg-[#1E1E2A] hover:bg-gray-50 dark:hover:bg-[#252535] text-[#2C1E26] dark:text-[#FFFFFF] shadow-2xs',
            'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none'
          )}
          title="Trang trước"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75px]" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="w-7 text-center font-medium text-[13px] text-[#68515E] dark:text-[#D8C9D2] select-none">
                  …
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(Number(page))}
                className={clsx(
                  'min-w-[32px] h-8 px-2 rounded-full text-[13px] leading-[18px] font-medium transition-all',
                  isCurrent
                    ? 'bg-gradient-to-r from-[#E27AA1] to-[#F092B5] text-white shadow-xs ring-2 ring-[#E27AA1]/25 font-semibold'
                    : 'bg-white dark:bg-[#1E1E2A] hover:bg-gray-50 dark:hover:bg-[#252535] text-[#2C1E26] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#262634] shadow-2xs'
                )}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile current page indicator */}
        <span className="sm:hidden text-[12px] leading-[16px] font-medium text-[#2C1E26] dark:text-[#FFFFFF] px-2 tabular-nums">
          {currentPage} / {safeTotalPages}
        </span>

        {/* Next Page */}
        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'border border-[#E5E7EB] dark:border-[#262634] bg-white dark:bg-[#1E1E2A] hover:bg-gray-50 dark:hover:bg-[#252535] text-[#2C1E26] dark:text-[#FFFFFF] shadow-2xs',
            'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none'
          )}
          title="Trang sau"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75px]" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(safeTotalPages)}
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            'border border-[#E5E7EB] dark:border-[#262634] bg-white dark:bg-[#1E1E2A] hover:bg-gray-50 dark:hover:bg-[#252535] text-[#2C1E26] dark:text-[#FFFFFF] shadow-2xs',
            'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none'
          )}
          title="Trang cuối"
          aria-label="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4 stroke-[1.75px]" />
        </button>
      </div>
    </div>
  );
};
