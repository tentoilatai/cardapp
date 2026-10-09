import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { EmptyState } from './EmptyState';
import { GlassSkeleton } from '../glass/GlassSkeleton';
import { BottomSheet } from './BottomSheet';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  priority?: 1 | 2 | 3; // 1 = always visible, 2 = tablet visible, 3 = desktop only
  mobile?: 'title' | 'subtitle' | 'value' | 'badge' | 'meta' | 'hidden';
  metaLabel?: string;
  accessor?: (row: T) => any;
  render?: (row: T, index: number) => React.ReactNode;
  sticky?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  groupBy?: (row: T) => { key: string; label: string; subLabel?: string };
  className?: string;
  testId?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyAction,
  onRowClick,
  onEdit,
  onDelete,
  groupBy,
  className = '',
  testId,
}: DataTableProps<T>) {
  const { isMobile, isTablet } = useBreakpoint();
  const [actionSheetRow, setActionSheetRow] = useState<T | null>(null);

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="w-full h-full p-4 space-y-3">
        <GlassSkeleton height={48} className="rounded-2xl" />
        <GlassSkeleton height={48} className="rounded-2xl" />
        <GlassSkeleton height={48} className="rounded-2xl" />
        <GlassSkeleton height={48} className="rounded-2xl" />
        <GlassSkeleton height={48} className="rounded-2xl" />
      </div>
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          testId="data-table-empty"
        />
      </div>
    );
  }

  // MOBILE (< 768px): Render as standardized glass cards (Tier 2)
  if (isMobile) {
    const titleCol = columns.find((c) => c.mobile === 'title');
    const valueCol = columns.find((c) => c.mobile === 'value');
    const subtitleCol = columns.find((c) => c.mobile === 'subtitle');
    const badgeCol = columns.find((c) => c.mobile === 'badge');
    const metaCols = columns.filter((c) => c.mobile === 'meta').slice(0, 2); // max 2 meta items

    const renderCell = (col?: DataTableColumn<T>, row?: T, index?: number) => {
      if (!col || !row) return null;
      if (col.render) return col.render(row, index || 0);
      if (col.accessor) return col.accessor(row);
      return (row as any)[col.id];
    };

    // Grouping items if groupBy prop provided
    type GroupMap = { [groupKey: string]: { label: string; subLabel?: string; items: { row: T; index: number }[] } };
    let groups: { groupKey: string; label: string; subLabel?: string; items: { row: T; index: number }[] }[] = [];

    if (groupBy) {
      const map: GroupMap = {};
      data.forEach((row, idx) => {
        const info = groupBy(row);
        if (!map[info.key]) {
          map[info.key] = { label: info.label, subLabel: info.subLabel, items: [] };
        }
        map[info.key].items.push({ row, index: idx });
      });
      groups = Object.entries(map).map(([k, v]) => ({ groupKey: k, ...v }));
    } else {
      groups = [{ groupKey: 'all', label: '', items: data.map((row, index) => ({ row, index })) }];
    }

    const hasActions = Boolean(onEdit || onDelete);

    return (
      <div data-testid={testId || 'data-table'} className="w-full">
        <div
          data-testid="mobile-card-list"
          className={`space-y-4 pb-4 ${className}`}
        >
        {groups.map((group) => (
          <div key={group.groupKey} className="space-y-3">
            {/* Sticky Group Header */}
            {group.label && (
              <div className="sticky top-[56px] z-10 glass-surface-tier2 px-4 py-2 rounded-[16px] shadow-xs flex items-center justify-between text-[0.8125rem] leading-[1.125rem] font-semibold text-[#2C1E26] dark:text-[#FFFFFF]">
                <span>{group.label}</span>
                {group.subLabel && (
                  <span className="text-[0.8125rem] leading-[1.125rem] text-[#E27AA1] tabular-nums font-semibold">
                    {group.subLabel}
                  </span>
                )}
              </div>
            )}

            {/* Group Cards (Tier 2 surface) */}
            {group.items.map(({ row, index }) => {
              const key = keyExtractor(row, index);
              return (
                <div
                  key={key}
                  data-testid="mobile-card-item"
                  onClick={() => onRowClick?.(row)}
                  className={`glass-surface-tier2 p-3.5 sm:p-4 rounded-2xl space-y-2 transition-all min-h-[72px] active:scale-[0.98] border border-[#E5E7EB] dark:border-[#262634] shadow-xs ${
                    onRowClick ? 'cursor-pointer hover:border-[#E27AA1]/40' : ''
                  }`}
                >
                  {/* Row 1: Title (left, truncate) + Value (right, tabular-nums) + Actions Button (right) */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="font-semibold text-[0.9375rem] leading-[1.375rem] text-[#2C1E26] dark:text-[#FFFFFF] truncate min-w-0 flex-1">
                      {renderCell(titleCol, row, index) || '—'}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {valueCol && (
                        <div className="text-[0.9375rem] leading-[1.375rem] font-semibold text-[#E27AA1] dark:text-[#F092B5] tabular-nums shrink-0">
                          {renderCell(valueCol, row, index)}
                        </div>
                      )}

                      {/* ⋯ 44px Touch Target Actions Button */}
                      {hasActions && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionSheetRow(row);
                          }}
                          className="w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-[#68515E] dark:text-[#D8C9D2] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 touch-target cursor-pointer"
                          aria-label="Thao tác"
                        >
                          <MoreHorizontal className="w-5 h-5 stroke-[1.75px]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Subtitle (left) + Status Badge (right) */}
                  {(subtitleCol || badgeCol) && (
                    <div className="flex items-center justify-between gap-2 text-[0.8125rem] leading-[1.125rem]">
                      <div className="text-[0.8125rem] leading-[1.125rem] font-normal text-[#68515E] dark:text-[#D8C9D2] truncate min-w-0">
                        {renderCell(subtitleCol, row, index)}
                      </div>
                      {badgeCol && (
                        <div className="shrink-0">
                          {renderCell(badgeCol, row, index)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 3 (optional): Meta info pills (max 2) */}
                  {metaCols.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 border-t border-[#E5E7EB] dark:border-[#262634] text-[0.75rem] leading-[1rem] text-[#68515E] dark:text-[#D8C9D2]">
                      {metaCols.map((mCol) => {
                        const content = renderCell(mCol, row, index);
                        if (!content) return null;
                        return (
                          <div key={mCol.id} className="flex items-center gap-1">
                            <span className="font-normal text-[#68515E]/80 dark:text-[#D8C9D2]/80">
                              {mCol.metaLabel || mCol.header}:
                            </span>
                            <span className="font-medium text-[#2C1E26] dark:text-[#FFFFFF]">
                              {content}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Mobile Row Action BottomSheet */}
        <BottomSheet
          isOpen={!!actionSheetRow}
          onClose={() => setActionSheetRow(null)}
          title="Thao tác"
          testId="card-actions-bottom-sheet"
        >
          <div className="space-y-2">
            {onEdit && actionSheetRow && (
              <button
                type="button"
                onClick={() => {
                  const row = actionSheetRow;
                  setActionSheetRow(null);
                  onEdit(row);
                }}
                className="w-full h-[48px] flex items-center gap-3 px-5 rounded-xl bg-white dark:bg-[#1E1E2A] border border-[#E5E7EB] dark:border-[#2D2D3C] hover:bg-gray-50 dark:hover:bg-[#252535] text-[#2C1E26] dark:text-[#FFFFFF] font-medium text-[0.875rem] max-md:text-[0.9375rem] leading-[1.375rem] transition-all active:scale-[0.98] touch-target cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Edit2 className="w-4 h-4 stroke-[1.75px]" />
                </div>
                <span>Sửa</span>
              </button>
            )}

            {onDelete && actionSheetRow && (
              <button
                type="button"
                onClick={() => {
                  const row = actionSheetRow;
                  setActionSheetRow(null);
                  onDelete(row);
                }}
                className="w-full h-[48px] flex items-center gap-3 px-5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 text-[#E11D48] font-medium text-[0.875rem] max-md:text-[0.9375rem] leading-[1.375rem] transition-all active:scale-[0.98] touch-target cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/15 text-[#E11D48] flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 stroke-[1.75px]" />
                </div>
                <span>Xóa</span>
              </button>
            )}
          </div>
        </BottomSheet>
      </div>
    </div>
    );
  }

  // TABLET / DESKTOP (>= 768px): Unified Table with fixed column widths, sticky header, and sticky first column
  const visibleColumns = columns.filter((col) => {
    if (col.mobile === 'hidden' && !isTablet) return false;
    if (isTablet && col.priority === 3) return false;
    return true;
  });

  return (
    <div
      data-testid={testId || 'data-table-container'}
      className={`w-full h-full overflow-auto relative overscroll-contain rounded-[24px] ${className}`}
    >
      <table className="w-full text-left border-collapse table-fixed">
        {/* Sticky Table Header (Tier 2 Surface - Solid translucent without nested blur) */}
        <thead className="sticky top-0 z-20 glass-surface-tier2 border-b border-black/5 dark:border-white/10">
          <tr className="h-[48px]">
            {visibleColumns.map((col, idx) => {
              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              const isFirst = idx === 0 && col.sticky !== false;

              return (
                <th
                  key={col.id}
                  data-role="column-header"
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-3 text-[0.8125rem] leading-[1.125rem] font-medium text-[#68515E] dark:text-[#D8C9D2] uppercase tracking-wider select-none truncate ${alignClass} ${
                    isFirst ? 'sticky left-0 z-30 bg-inherit' : ''
                  }`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body (Tier 3 Flat: 48px fixed height with alternating subtle tint & saturated hover) */}
        <tbody className="divide-y divide-black/5 dark:divide-white/5">
          {data.map((row, rowIndex) => {
            const key = keyExtractor(row, rowIndex);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={`h-[48px] even:bg-white/[0.04] dark:even:bg-white/[0.02] hover:bg-white/10 dark:hover:bg-white/05 transition-colors text-[0.875rem] leading-[1.375rem] text-[#2C1E26] dark:text-[#FFFFFF] group ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {visibleColumns.map((col, colIndex) => {
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';

                  const isFirst = colIndex === 0 && col.sticky !== false;

                  let cellContent: React.ReactNode = null;
                  if (col.render) {
                    cellContent = col.render(row, rowIndex);
                  } else if (col.accessor) {
                    cellContent = col.accessor(row);
                  } else {
                    cellContent = (row as any)[col.id];
                  }

                  return (
                    <td
                      key={col.id}
                      style={col.width ? { width: col.width } : undefined}
                      className={`px-4 py-2.5 truncate font-normal ${alignClass} ${
                        isFirst
                          ? 'sticky left-0 z-10 bg-inherit font-medium'
                          : ''
                      }`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
