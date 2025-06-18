import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface Property {
  id: string;
  address: string;
  property_type: string;
  price: number;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface FilterOptions {
  query: string;
  limit: number;
  offset: number;
  sort_by: string;
  sort_order: string;
}

const defaultFilterOptions: FilterOptions = {
  query: "",
  limit: 10,
  offset: 0,
  sort_by: "address",
  sort_order: "asc",
};

const UV_PropertyList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(() => {
    return {
      query: searchParams.get("query") || defaultFilterOptions.query,
      limit: Number(searchParams.get("limit")) || defaultFilterOptions.limit,
      offset: Number(searchParams.get("offset")) || defaultFilterOptions.offset,
      sort_by: searchParams.get("sort_by") || defaultFilterOptions.sort_by,
      sort_order: searchParams.get("sort_order") || defaultFilterOptions.sort_order,
    };
  });

  const auth = useAppStore((state) => state.auth);
  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch properties including sorting parameters as per datamap
  const fetchProperties = async (): Promise<Property[]> => {
    const response = await axios.get(`${baseUrl}/api/properties`, {
      params: {
        query: filterOptions.query,
        limit: filterOptions.limit,
        offset: filterOptions.offset,
        sort_by: filterOptions.sort_by,
        sort_order: filterOptions.sort_order,
      },
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    return response.data;
  };

  const {
    data: properties,
    isLoading,
    error,
  } = useQuery<Property[], Error>(["properties", filterOptions], fetchProperties, {
    keepPreviousData: true,
  });

  // Update URL search params when filterOptions change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterOptions.query) params.query = filterOptions.query;
    params.limit = filterOptions.limit.toString();
    params.offset = filterOptions.offset.toString();
    if (filterOptions.sort_by) params.sort_by = filterOptions.sort_by;
    if (filterOptions.sort_order) params.sort_order = filterOptions.sort_order;
    setSearchParams(params);
  }, [filterOptions, setSearchParams]);

  // Handlers for filtering input
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterOptions({ ...filterOptions, query: e.target.value, offset: 0 });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions({ ...filterOptions, sort_by: e.target.value, offset: 0 });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions({ ...filterOptions, sort_order: e.target.value, offset: 0 });
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    setFilterOptions((prev) => ({
      ...prev,
      offset: Math.max(prev.offset - prev.limit, 0),
    }));
  };

  const handleNextPage = () => {
    setFilterOptions((prev) => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  };

  // Mutation for linking a property to a client using the client property interest endpoint.
  const linkPropertyMutation = useMutation(
    async ({
      propertyId,
      clientId,
      property,
    }: {
      propertyId: string;
      clientId: string;
      property: Property;
    }) => {
      const payload = {
        client_id: clientId,
        property_type: property.property_type,
        preferred_location: property.address,
        price_min: property.price,
        price_max: property.price,
        additional_notes: "Linked via property list",
      };
      const response = await axios.post(`${baseUrl}/api/client-property-interests`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        alert("Property linked successfully");
        queryClient.invalidateQueries({ queryKey: ["properties", filterOptions] });
      },
      onError: (err: any) => {
        alert("Error linking property: " + err.message);
      },
    }
  );

  // Updated mutation: ask for the linking record ID instead of using property.id
  const unlinkPropertyMutation = useMutation(
    async ({ linkRecordId }: { linkRecordId: string }) => {
      const response = await axios.delete(`${baseUrl}/api/client-property-interests/${linkRecordId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    },
    {
      onSuccess: () => {
        alert("Property unlinked successfully");
        queryClient.invalidateQueries({ queryKey: ["properties", filterOptions] });
      },
      onError: (err: any) => {
        alert("Error unlinking property: " + err.message);
      },
    }
  );

  const handleLinkClick = (property: Property) => {
    const clientId = prompt("Enter Client ID to link this property:");
    if (clientId) {
      linkPropertyMutation.mutate({ propertyId: property.id, clientId, property });
    }
  };

  const handleUnlinkClick = (property: Property) => {
    const linkRecordId = prompt("Enter Link Record ID to unlink this property:");
    if (linkRecordId) {
      unlinkPropertyMutation.mutate({ linkRecordId });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Property Listings</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search properties..."
          aria-label="Search properties"
          value={filterOptions.query}
          onChange={handleSearchInputChange}
          className="border p-2 rounded mr-2"
        />
        <select value={filterOptions.sort_by} onChange={handleSortByChange} className="border p-2 rounded mr-2">
          <option value="address">Address</option>
          <option value="price">Price</option>
        </select>
        <select value={filterOptions.sort_order} onChange={handleSortOrderChange} className="border p-2 rounded mr-2">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
      {isLoading ? (
        <div>Loading properties...</div>
      ) : error ? (
        <div>Error fetching properties: {error.message}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {properties && properties.length > 0 ? (
              properties.map(property => (
                <div key={property.id} className="border rounded p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{property.address}</span>
                    <span className="text-sm text-gray-500">{property.property_type}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-lg font-bold">£{property.price}</span>
                    <span className="ml-2">{property.status}</span>
                  </div>
                  {property.description && (
                    <p className="text-sm text-gray-700 mb-2">{property.description}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleLinkClick(property)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Link to Client
                    </button>
                    <button
                      onClick={() => handleUnlinkClick(property)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Unlink from Client
                    </button>
                    <Link
                      to={`/properties/${property.id}`}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div>No properties found.</div>
            )}
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={filterOptions.offset === 0}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {Math.floor(filterOptions.offset / filterOptions.limit) + 1}</span>
            <button
              onClick={handleNextPage}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UV_PropertyList;