import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/features/reports/services/reportsApi';

function unwrap<T>(promise: Promise<{ data: T }>) {
  return promise.then((r) => r.data);
}

export function useFinancialReport(year: number | null, month: number | null) {
  return useQuery({
    queryKey: ['reports', 'financial', year, month],
    queryFn: () => unwrap(reportsApi.financial(year as number, month as number)),
    enabled: !!year && !!month,
  });
}

export function useOccupancyReport() {
  return useQuery({
    queryKey: ['reports', 'occupancy'],
    queryFn: () => unwrap(reportsApi.occupancy()),
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function useExportFinancialCsv() {
  const [isExporting, setIsExporting] = useState(false);
  const exportFinancial = useCallback(async (year: number, month: number) => {
    try {
      setIsExporting(true);
      const res = await reportsApi.exportFinancial(year, month);
      downloadBlob(res.data as Blob, `financial_report_${year}_${String(month).padStart(2, '0')}.csv`);
    } finally {
      setIsExporting(false);
    }
  }, []);
  return { isExporting, exportFinancial };
}

export function useExportOccupancyCsv() {
  const [isExporting, setIsExporting] = useState(false);
  const exportOccupancy = useCallback(async () => {
    try {
      setIsExporting(true);
      const res = await reportsApi.exportOccupancy();
      downloadBlob(res.data as Blob, 'occupancy_report.csv');
    } finally {
      setIsExporting(false);
    }
  }, []);
  return { isExporting, exportOccupancy };
}