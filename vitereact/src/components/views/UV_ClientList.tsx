import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

// Assuming Client type is defined in shared schema; if not, define inline interface
import { Client } from "@schema";

const UV_ClientList: React.FC = () => {
  // Read URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  const initialLimit = parseInt(searchParams.get("limit") || "10", 10);
  const initialOffset = parseInt(searchParams.get("offset") || "0", 10);
  const initialSortBy = searchParams.get("sort_by") || "";
  const initialSortOrder = searchParams.get("sort_order") || "asc";

  // Local state for search, pagination, and sorting
  const [search_query, setSearchQuery] = useState<string>(initialQuery);
  const [pagination, setPagination] = useState<{ limit: number; offset: number }>({
    limit: initialLimit,
    offset: initialOffset,
  });
  const [sort_options, setSortOptions] = useState<{ sort_by: string; sort_order: string }>({
    sort_by: initialSortBy,
    sort_order: initialSortOrder,
  });

  // Access global auth state from our Zustand store
  const auth = useAppStore((state) => state.auth);

  // Function to update URL search parameters (for browser state persistence)
  const updateSearchParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (search_query) params.query = search_query;
    params.limit = pagination.limit.toString();
    params.offset = pagination.offset.toString();
    if (sort_options.sort_by) params.sort_by = sort_options.sort_by;
    params.sort_order = sort_options.sort_order;
    setSearchParams(params);
  }, [search_query, pagination.limit, pagination.offset, sort_options.sort_by, sort_options.sort_order, setSearchParams]);

  // Effect to update search params on state change
  useEffect(() => {
    updateSearchParams();
  }, [updateSearchParams]);

  // Data fetching function using axios and react-query
  const fetchClients = async (): Promise<Client[]> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await axios.get(`${baseUrl}/api/clients`, {
      params: {
        query: search_query,
        limit: pagination.limit,
        offset: pagination.offset,
        sort_by: sort_options.sort_by,
        sort_order: sort_options.sort_order,
      },
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
    return response.data;
  };

  const {
    data: clients,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Client[], Error>(
    ["clients", search_query, pagination.offset, pagination.limit, sort_options.sort_by, sort_options.sort_order],
    fetchClients,
    {
      keepPreviousData: true,
    }
  );

  // Handlers for search input change with basic validation to remove unwanted special chars (only alphanumeric and space allowed)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only letters, numbers, and spaces
    const sanitizedValue = value.replace(/[^\w\s]/gi, "");
    setSearchQuery(sanitizedValue);
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset offset when search changes
  };

  // Handlers for sort options changes
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOptions((prev) => ({ ...prev, sort_by: e.target.value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset offset when sort changes
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOptions((prev) => ({ ...prev, sort_order: e.target.value }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  // Pagination handlers
  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(prev.offset - prev.limit, 0),
    }));
  };

  const handleNextPage = () => {
    // If the current fetched data has full limit then allow next page
    if (clients && clients.length === pagination.limit) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Client List</h1>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <label htmlFor="client-search" className="sr-only">Search Clients</label>
        <input
          id="client-search"
          type="text"
          value={search_query}
          onChange={handleSearchChange}
          placeholder="Search clients..."
          aria-label="Search clients"
          className="border border-gray-300 rounded px-3 py-2 mb-2 md:mb-0 md:mr-4 focus:outline-none focus:ring focus:border-blue-300"
        />
        <div className="flex items-center space-x-2">
          <label htmlFor="sort-by" className="font-medium">Sort by:</label>
          <select
            id="sort-by"
            value={sort_options.sort_by}
            onChange={handleSortByChange}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select</option>
            <option value="first_name">First Name</option>
            <option value="last_name">Last Name</option>
            <option value="status">Status</option>
          </select>
          <select
            value={sort_options.sort_order}
            onChange={handleSortOrderChange}
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>
      {/* Loading and Error states */}
      {isLoading && <div className="text-blue-600">Loading clients...</div>}
      {isError && <div className="text-red-500">Error: {(error as Error).message}</div>}
      {/* Clients Table */}
      {clients && clients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Address</th>
                <th className="px-4 py-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border-b">
                    <Link to={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                      {client.first_name} {client.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 border-b">{client.address}</td>
                  <td className="px-4 py-2 border-b">{client.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !isLoading && <div>No clients found.</div>
      )}
      {/* Pagination Controls */}
      <div className="mt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={pagination.offset === 0}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
        >
          Previous
        </button>
        <span>
          Page {Math.floor(pagination.offset / pagination.limit) + 1}
        </span>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={clients ? clients.length < pagination.limit : true}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UV_ClientList;