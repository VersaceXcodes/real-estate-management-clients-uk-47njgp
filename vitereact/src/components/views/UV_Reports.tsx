import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

const UV_Reports: React.FC = () => {
  // Access auth state from global Zustand store
  const auth = useAppStore((state) => state.auth);

  // Get URL search parameters (start_date and end_date)
  const [searchParams] = useSearchParams();
  const initialStartDate = searchParams.get("start_date") || "";
  const initialEndDate = searchParams.get("end_date") || "";

  // Local state for report filters
  const [reportFilters, setReportFilters] = useState<{
    startDate: string;
    endDate: string;
    reportType: string;
  }>({
    startDate: initialStartDate,
    endDate: initialEndDate,
    reportType: "",
  });

  // React Query client instance
  const queryClient = useQueryClient();

  // Function to fetch report data. 
  const fetchReports = async () => {
    // Build query parameters using filter state
    const params = {
      start_date: reportFilters.startDate,
      end_date: reportFilters.endDate,
      report_type: reportFilters.reportType,
    };
    const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/reports`;
    try {
      // TODO: Endpoint not found in OpenAPI spec / Backend Server main code
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth.token}` },
        params: params,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // useQuery hook to fetch reports based on filter criteria
  const {
    data: reportData,
    refetch,
    isLoading,
    error,
  } = useQuery<any, Error>(["reports", reportFilters], fetchReports, {
    enabled: auth.is_authenticated, // Only fetch if authenticated
  });

  // Mutation hook to export reports
  const exportReportMutation = useMutation(async (format: string) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/reports/export`;
    try {
      // TODO: Endpoint not found in OpenAPI spec / Backend Server main code
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth.token}` },
        params: {
          start_date: reportFilters.startDate,
          end_date: reportFilters.endDate,
          report_type: reportFilters.reportType,
          format: format, // 'csv' or 'excel'
        },
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  });

  // Handle export button click
  const handleExport = (format: string) => {
    exportReportMutation.mutate(format, {
      onSuccess: (data) => {
        // Create a blob and initiate a download
        const blob = new Blob(
          [data],
          {
            type:
              format === "csv"
                ? "text/csv"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        );
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `report.${format === "csv" ? "csv" : "xlsx"}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      },
      onError: (error: any) => {
        console.error("Export error:", error.message);
      },
    });
  };

  // Trigger refreshReports action whenever reportFilters changes
  useEffect(() => {
    refetch();
  }, [reportFilters, refetch]);

  return (
    <>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manager Reports</h1>
        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={reportFilters.startDate}
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    startDate: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={reportFilters.endDate}
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    endDate: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <select
                value={reportFilters.reportType}
                onChange={(e) =>
                  setReportFilters({
                    ...reportFilters,
                    reportType: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded border-gray-300"
              >
                <option value="">Select Report Type</option>
                <option value="client_acquisitions">
                  Client Acquisitions
                </option>
                <option value="appointment_conversions">
                  Appointment Conversions
                </option>
                <option value="communication_logs">
                  Communication Logs
                </option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => refetch()}
              className="mr-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Refresh Reports
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="mr-2 px-4 py-2 bg-green-500 text-white rounded"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="px-4 py-2 bg-teal-500 text-white rounded"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* Loading and Error State */}
        {isLoading && <p>Loading Reports...</p>}
        {error && <p className="text-red-600">Error: {error.message}</p>}

        {/* Report Data Display */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Report Summary</h2>
          {reportData && reportData.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Metric</th>
                  <th className="px-4 py-2 border">Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">
                      {item.metric || "N/A"}
                    </td>
                    <td className="px-4 py-2 border">
                      {item.value || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !isLoading && <p>No report data available.</p>
          )}
        </div>

        {/* Link to Manage Bulk Data / Import-Export Interface */}
        <div className="mt-4">
          <Link to="/clients/import" className="text-blue-600 underline">
            Manage Bulk Data (Import/Export)
          </Link>
        </div>
      </div>
    </>
  );
};

export default UV_Reports;