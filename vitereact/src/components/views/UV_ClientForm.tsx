import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppStore } from "@/store/main";

const UV_ClientForm: React.FC = () => {
  const { client_id } = useParams<{ client_id?: string }>();
  const navigate = useNavigate();
  const auth = useAppStore((state) => state.auth);
  const add_notification = useAppStore((state) => state.add_notification);
  const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Initialize form_data with default values as per datamap
  const [form_data, setForm_data] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    status: "",
    additional_details: "",
    property_interests: [],
    communications: [],
  });

  const [form_errors, setForm_errors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // If editing, get current client info and populate form_data
  useEffect(() => {
    if (client_id) {
      axios
        .get(`${base_url}/api/clients/${client_id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        .then((res) => {
          const clientData = res.data;
          // Convert additional_details object to a formatted JSON string for the textarea
          if (clientData.additional_details && typeof clientData.additional_details === "object") {
            clientData.additional_details = JSON.stringify(clientData.additional_details, null, 2);
          }
          setForm_data(clientData);
        })
        .catch((error) => {
          add_notification({
            id: Date.now().toString(),
            type: "error",
            message:
              error.response?.data?.message || "Failed to load client data",
            timestamp: new Date().toISOString(),
          });
        });
    }
  }, [client_id, auth.token, base_url, add_notification]);

  // Inline field validation function
  const validateField = (name: string, value: any): string => {
    let error = "";
    // Ensure required fields are filled
    if (["first_name", "last_name", "email", "phone", "address", "status"].includes(name)) {
      if (!value || value.toString().trim() === "") {
        error = "This field is required";
      }
    }
    if (name === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
      error = "Invalid email format";
    }
    // Update error state for the field
    setForm_errors((prev: any) => ({ ...prev, [name]: error }));
    return error;
  };

  // Handle changes for basic input fields (personal information & additional_details)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm_data((prev: any) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Handle changes for Property Interest fields (nested object inside property_interests array)
  const handlePropertyInterestChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let updatedValue: any = value;
    if (["price_min", "price_max"].includes(name)) {
      updatedValue = value === "" ? "" : parseFloat(value);
    }
    const existing = form_data.property_interests[0] || {};
    const updatedInterest = { ...existing, [name]: updatedValue };
    setForm_data((prev: any) => ({
      ...prev,
      property_interests: [updatedInterest],
    }));
  };

  // Handle changes for Communication Log fields (nested object inside communications array)
  const handleCommunicationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const existing = form_data.communications[0] || {};
    const updatedComm = { ...existing, [name]: value };
    setForm_data((prev: any) => ({
      ...prev,
      communications: [updatedComm],
    }));
  };

  // Handle file selection for document upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Submit handler for the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields before submission
    const requiredFields = ["first_name", "last_name", "email", "phone", "address", "status"];
    let errorsFound: any = {};
    requiredFields.forEach((field) => {
      const err = validateField(field, form_data[field]);
      if (err) {
        errorsFound[field] = err;
      }
    });
    // Validate that additional_details, if provided, is valid JSON
    if (form_data.additional_details) {
      try {
        JSON.parse(form_data.additional_details);
      } catch {
        errorsFound["additional_details"] = "Invalid JSON format";
        setForm_errors((prev: any) => ({ ...prev, additional_details: "Invalid JSON format" }));
      }
    }
    if (Object.keys(errorsFound).length > 0) {
      return; // Abort submission if there are validation errors
    }

    setIsSubmitting(true);
    try {
      // Prepare submission data by parsing additional_details
      const submissionData = { ...form_data };
      if (submissionData.additional_details) {
        submissionData.additional_details = JSON.parse(submission_data.additional_details);
      }
      let clientResponse;
      if (client_id) {
        // Update existing client
        clientResponse = await axios.put(
          `${base_url}/api/clients/${client_id}`,
          submissionData,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
      } else {
        // Create new client
        clientResponse = await axios.post(
          `${base_url}/api/clients`,
          submissionData,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
      }
      const clientResult = clientResponse.data;

      // If property interest details provided, submit them
      if (
        submissionData.property_interests &&
        submissionData.property_interests.length > 0 &&
        submissionData.property_interests[0].property_type
      ) {
        await axios.post(
          `${base_url}/api/client-property-interests`,
          {
            client_id: clientResult.id,
            ...submissionData.property_interests[0],
          },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
      }
      // If communication log details provided, submit them
      if (
        submissionData.communications &&
        submissionData.communications.length > 0 &&
        submissionData.communications[0].communication_type
      ) {
        await axios.post(
          `${base_url}/api/communication-logs`,
          {
            client_id: clientResult.id,
            user_id: auth.user.id,
            ...submissionData.communications[0],
            timestamp: new Date().toISOString(),
          },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
      }
      // If a document file is selected, simulate document upload
      if (selectedFile) {
        await axios.post(
          `${base_url}/api/client-documents`,
          {
            client_id: clientResult.id,
            document_name: selectedFile.name,
            document_url: `https://picsum.photos/seed/${selectedFile.name}`,
            document_type: selectedFile.type,
            uploaded_at: new Date().toISOString(),
          },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
      }

      add_notification({
        id: Date.now().toString(),
        type: "success",
        message: client_id
          ? "Client updated successfully"
          : "Client created successfully",
        timestamp: new Date().toISOString(),
      });
      navigate(`/clients/${clientResult.id}`);
    } catch (error: any) {
      add_notification({
        id: Date.now().toString(),
        type: "error",
        message:
          error.response?.data?.message || "Submission failed",
        timestamp: new Date().toISOString(),
      });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          {client_id ? "Edit Client" : "New Client"}
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            {/* Personal Information */}
            <div>
              <label className="block mb-1 font-semibold" htmlFor="first_name">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={form_data.first_name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter first name"
              />
              {form_errors.first_name && (
                <p className="text-red-500 text-sm">{form_errors.first_name}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="last_name">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={form_data.last_name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter last name"
              />
              {form_errors.last_name && (
                <p className="text-red-500 text-sm">{form_errors.last_name}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form_data.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter email"
              />
              {form_errors.email && (
                <p className="text-red-500 text-sm">{form_errors.email}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="phone">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={form_data.phone}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter UK phone number"
              />
              {form_errors.phone && (
                <p className="text-red-500 text-sm">{form_errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="address">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={form_data.address}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter UK-formatted address"
              />
              {form_errors.address && (
                <p className="text-red-500 text-sm">{form_errors.address}</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold" htmlFor="status">
                Status
              </label>
              <input
                type="text"
                id="status"
                name="status"
                value={form_data.status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter status (e.g., active, prospective)"
              />
              {form_errors.status && (
                <p className="text-red-500 text-sm">{form_errors.status}</p>
              )}
            </div>
            <div>
              <label
                className="block mb-1 font-semibold"
                htmlFor="additional_details"
              >
                Additional Details
              </label>
              <textarea
                id="additional_details"
                name="additional_details"
                value={form_data.additional_details}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Enter any additional details as JSON"
              ></textarea>
              {form_errors.additional_details && (
                <p className="text-red-500 text-sm">{form_errors.additional_details}</p>
              )}
            </div>
            {/* Property Interest Section */}
            <div className="p-4 border rounded">
              <h2 className="text-xl font-semibold mb-2">
                Property Interest
              </h2>
              <div>
                <label
                  className="block mb-1"
                  htmlFor="property_type"
                >
                  Property Type
                </label>
                <input
                  type="text"
                  id="property_type"
                  name="property_type"
                  value={form_data.property_interests[0]?.property_type || ""}
                  onChange={handlePropertyInterestChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Residential, Commercial"
                />
              </div>
              <div>
                <label
                  className="block mb-1"
                  htmlFor="preferred_location"
                >
                  Preferred Location
                </label>
                <input
                  type="text"
                  id="preferred_location"
                  name="preferred_location"
                  value={form_data.property_interests[0]?.preferred_location || ""}
                  onChange={handlePropertyInterestChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., London"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1" htmlFor="price_min">
                    Price Min
                  </label>
                  <input
                    type="number"
                    id="price_min"
                    name="price_min"
                    value={form_data.property_interests[0]?.price_min ?? ""}
                    onChange={handlePropertyInterestChange}
                    className="w-full p-2 border rounded"
                    placeholder="Minimum price"
                  />
                </div>
                <div>
                  <label className="block mb-1" htmlFor="price_max">
                    Price Max
                  </label>
                  <input
                    type="number"
                    id="price_max"
                    name="price_max"
                    value={form_data.property_interests[0]?.price_max ?? ""}
                    onChange={handlePropertyInterestChange}
                    className="w-full p-2 border rounded"
                    placeholder="Maximum price"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1" htmlFor="additional_notes">
                  Additional Notes
                </label>
                <textarea
                  id="additional_notes"
                  name="additional_notes"
                  value={form_data.property_interests[0]?.additional_notes || ""}
                  onChange={handlePropertyInterestChange}
                  className="w-full p-2 border rounded"
                  placeholder="Any additional notes"
                ></textarea>
              </div>
            </div>
            {/* Communication Log Section */}
            <div className="p-4 border rounded">
              <h2 className="text-xl font-semibold mb-2">
                Communication Log
              </h2>
              <div>
                <label
                  className="block mb-1"
                  htmlFor="communication_type"
                >
                  Communication Type
                </label>
                <input
                  type="text"
                  id="communication_type"
                  name="communication_type"
                  value={form_data.communications[0]?.communication_type || ""}
                  onChange={handleCommunicationChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Call, Email"
                />
              </div>
              <div>
                <label className="block mb-1" htmlFor="note">
                  Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={form_data.communications[0]?.note || ""}
                  onChange={handleCommunicationChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter communication note"
                ></textarea>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="follow_up_flag"
                  name="follow_up_flag"
                  checked={form_data.communications[0]?.follow_up_flag || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const existing = form_data.communications[0] || {};
                    const updated = { ...existing, follow_up_flag: checked };
                    setForm_data((prev: any) => ({
                      ...prev,
                      communications: [updated],
                    }));
                  }}
                  className="mr-2"
                />
                <label htmlFor="follow_up_flag">Follow Up Required</label>
              </div>
            </div>
            {/* Document Upload Section */}
            <div>
              <label className="block mb-1 font-semibold" htmlFor="document">
                Upload Document
              </label>
              <input
                type="file"
                id="document"
                onChange={handleFileChange}
                className="w-full"
              />
            </div>
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 text-white rounded py-2 px-4 hover:bg-blue-600"
              >
                {isSubmitting
                  ? "Submitting..."
                  : client_id
                  ? "Update Client"
                  : "Create Client"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_ClientForm;