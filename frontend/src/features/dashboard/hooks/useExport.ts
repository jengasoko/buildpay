import { useCallback, useState } from 'react';
import { dashboardApi } from '../services/dashboardApi';

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
  const exportFinancial = useCallback(
    async (year: number, month: number) => {
      try {
        setIsExporting(true);
        const res = await dashboardApi.exportFinancialCsv(year, month);
        downloadBlob(res.data as Blob, `financial_report_${year}_${String(month).padStart(2, '0')}.csv`);
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );
  return { isExporting, exportFinancial };
}

export function useExportOccupancyCsv() {
  const [isExporting, setIsExporting] = useState(false);
  const exportOccupancy = useCallback(async () => {
    try {
      setIsExporting(true);
      const res = await dashboardApi.exportOccupancyCsv();
      downloadBlob(res.data as Blob, 'occupancy_report.csv');
    } finally {
      setIsExporting(false);
    }
  }, []);
  return { isExporting, exportOccupancy };
}

export function useExportRevenueTrendCsv() {
  const [isExporting, setIsExporting] = useState(false);
  const exportRevenueTrend = useCallback(
    async (months: number) => {
      try {
        setIsExporting(true);
        const res = await dashboardApi.exportRevenueTrendCsv(months);
        downloadBlob(res.data as Blob, 'revenue_trend.csv');
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );
  return { isExporting, exportRevenueTrend };
}