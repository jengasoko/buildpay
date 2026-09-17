import { useState } from 'react';
import { useFinancialReport, useOccupancyReport, useExportFinancialCsv, useExportOccupancyCsv } from '@/features/reports/hooks/useReports';
import { RevenueTrendChart } from '@/features/dashboard/components/RevenueTrendChart';
import { OccupancyTrendChart } from '@/features/dashboard/components/OccupancyTrendChart';
import { CollectionRateChart } from '@/features/dashboard/components/CollectionRateChart';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

const now = new Date();
const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

function currency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const financial = useFinancialReport(selectedYear, selectedMonth);
  const occupancy = useOccupancyReport();
  const { isExporting: exportFinLoading, exportFinancial } = useExportFinancialCsv();
  const { isExporting: exportOccLoading, exportOccupancy } = useExportOccupancyCsv();

  const finData = financial.data;

  const handleExportFinancial = () => {
    exportFinancial(selectedYear, selectedMonth);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Financial and occupancy overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Financial Report — {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </h2>
            <button
              onClick={handleExportFinancial}
              disabled={exportFinLoading || !finData}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exportFinLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {financial.isLoading && <LoadingSpinner message="Loading financial report..." />}
          {financial.error && (
            <ErrorMessage
              message="Failed to load financial report."
              onRetry={() => financial.refetch()}
            />
          )}

          {finData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Monthly Collected</p>
                  <p className="mt-1 text-3xl font-bold text-green-600">
                    {currency(finData.collected)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Outstanding</p>
                  <p className="mt-1 text-3xl font-bold text-red-600">
                    {currency(finData.outstanding)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="mt-1 text-3xl font-bold text-red-800">
                    {currency(finData.overdue)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Open Invoices</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{finData.open_invoices}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Active Leases</p>
                  <p className="mt-1 text-3xl font-bold text-indigo-600">{finData.active_leases}</p>
                </div>
              </div>

              <h3 className="text-md font-semibold text-gray-900 mb-3">Arrears Aging</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bucket
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finData.arrears.map((bucket) => (
                    <tr key={bucket.bucket} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bucket.bucket} days
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {bucket.count}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {currency(bucket.amount)}
                      </td>
                    </tr>
                  ))}
                  {finData.arrears.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                        No arrears data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Occupancy Report</h2>
            <button
              onClick={() => exportOccupancy()}
              disabled={exportOccLoading || !occupancy.data}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {exportOccLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {occupancy.isLoading && <LoadingSpinner message="Loading occupancy report..." />}
          {occupancy.error && (
            <ErrorMessage
              message="Failed to load occupancy report."
              onRetry={() => occupancy.refetch()}
            />
          )}

          {occupancy.data && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Total Houses</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {occupancy.data.total_houses}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="mt-1 text-3xl font-bold text-green-600">
                    {occupancy.data.available_houses}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Occupied</p>
                  <p className="mt-1 text-3xl font-bold text-red-600">
                    {occupancy.data.occupied_houses}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <p className="text-sm font-medium text-gray-500">Active Leases</p>
                  <p className="mt-1 text-3xl font-bold text-indigo-600">
                    {occupancy.data.active_leases}
                  </p>
                </div>
              </div>

              <h3 className="text-md font-semibold text-gray-900 mb-3">Houses</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupants
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {occupancy.data.by_house.map((house) => (
                    <tr key={house.house_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{house.house_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {house.title}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {house.occupants}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            house.available
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {house.available ? 'Available' : 'Occupied'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {occupancy.data.by_house.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        No houses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </section>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Revenue Trend (12 months)</h3>
            <RevenueTrendChart />
          </section>
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Occupancy Trend (12 months)</h3>
            <OccupancyTrendChart />
          </section>
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Payment Collection Rate (12 months)</h3>
            <CollectionRateChart />
          </section>
        </div>
      </div>
    </div>
  );
}
