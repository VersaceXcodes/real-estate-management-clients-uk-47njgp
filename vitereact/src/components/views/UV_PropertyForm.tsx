import React, { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

interface PropertyFormData {
  address: string;
  property_type: string;
  price: number;
  status: string;
  description: string;
  linked_clients: string[];
}

interface PropertyResponse {
  id: string;
  address: string;
  property_type: string;
  price: number;
  status: string;
  description: string;
  // The API may not return linked_clients but we support it in the form data.
  linked_clients?: string[];
}

const initialFormData: PropertyFormData = {
  address: "",
  property_type: "",
  price: 0,
  status: "",
  description: "",
  linked_clients: []
};

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const UV_PropertyForm: React.FC = () => {
  const { property_id } = useParams<{ property_id: string }>();
  const navigate = useNavigate();
  const auth = useAppStore((state) => state.auth);

  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Fetch the property details if in edit mode
  const { data: propertyData, isLoading: isLoadingProperty, error: propertyError } = useQuery<PropertyResponse>(
    ["property", property_id],
    async () => {
      const response = await axios.get(
        `${baseUrl}/api/properties/${property_id}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      return response.data;
    },
    { enabled: Boolean(property_id) }
  );

  useEffect(() => {
    if (propertyData) {
      setFormData({
        address: propertyData.address || "",
        property_type: propertyData.property_type || "",
        price: propertyData.price || 0,
        status: propertyData.status || "",
        description: propertyData.description || "",
        linked_clients: propertyData.linked_clients ? propertyData.linked_clients : []
      });
    }
  }, [propertyData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "price") {
      setFormData({ ...formData, [name]: Number(value) });
    } else if (name === "linked_clients") {
      // Convert comma separated string into an array of trimmed non-empty strings
      const array = value.split(",").map(item => item.trim()).filter(item => item !== "");
      setFormData({ ...formData, linked_clients: array });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }
    if (!formData.property_type.trim()) {
      newErrors.property_type = "Property type is required.";
    }
    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than 0.";
    }
    if (!formData.status.trim()) {
      newErrors.status = "Status is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation<PropertyResponse, any, PropertyFormData>({
    mutationFn: async (data) => {
      if (property_id) {
        // Edit existing property record via PUT call
        const response = await axios.put(
          `${baseUrl}/api/properties/${property_id}`,
          data,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        return response.data;
      } else {
        // Create new property record via POST call
        const response = await axios.post(
          `${baseUrl}/api/properties`,
          data,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        return response.data;
      }
    },
    onSuccess: () => {
      // Redirect to the property list view after successful submission
      navigate("/properties");
    },
    onError: (error: any) => {
      setSubmitError(error.response?.data?.message || "Submission failed.");
    }
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitError("");
      mutation.mutate(formData);
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          {property_id ? "Edit Property" : "Add New Property"}
        </h1>
        {propertyError && (
          <p className="mb-4 text-red-600">
            Error loading property details. Please try again later.
          </p>
        )}
        {property_id && isLoadingProperty && !propertyError && (
          <p className="mb-4 text-gray-600">Loading property details...</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Property Address"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
          </div>
          <div>
            <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">Property Type</label>
            <input
              id="property_type"
              type="text"
              name="property_type"
              value={formData.property_type}
              onChange={handleInputChange}
              placeholder="e.g., Residential, Commercial"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.property_type && <p className="text-red-500 text-sm">{errors.property_type}</p>}
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
            <input
              id="price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Property Price"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">Select status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Property Description"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label htmlFor="linked_clients" className="block text-sm font-medium text-gray-700">Linked Clients</label>
            <input
              id="linked_clients"
              type="text"
              name="linked_clients"
              value={formData.linked_clients.join(", ")}
              onChange={handleInputChange}
              placeholder="Enter client IDs separated by commas"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          {submitError && <div className="text-red-500 text-sm">{submitError}</div>}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              {mutation.isLoading ? "Submitting..." : "Submit"}
            </button>
            <Link to="/properties" className="text-blue-600 hover:underline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_PropertyForm;