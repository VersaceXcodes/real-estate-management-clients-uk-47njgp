import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

// Define interfaces based on the OpenAPI schemas
interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  additional_details: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CommunicationLog {
  id: string;
  client_id: string;
  user_id: string;
  communication_type: string;
  note: string;
  follow_up_flag: boolean;
  timestamp: string;
}

interface Appointment {
  id: string;
  client_id: string;
  property_id: string;
  agent_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientPropertyInterest {
  id: string;
  client_id: string;
  property_type: string;
  preferred_location: string;
  price_min: number;
  price_max: number;
  additional_notes: string;
  created_at: string;
}

interface ClientDocument {
  id: string;
  client_id: string;
  document_name: string;
  document_url: string;
  document_type: string;
  uploaded_at: string;
}

const UV_ClientProfile: React.FC = () => {
  const { client_id } = useParams<{ client_id: string }>();
  const auth = useAppStore((state) => state.auth);
  const token = auth.token;
  const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const queryClient = useQueryClient();

  // Local state for inline edit mode
  const [editMode, setEditMode] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [updateError, setUpdateError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Query for client details
  const {
    data: clientDetails,
    isLoading: loadingClient,
    error: errorClient
  } = useQuery<Client>(
    ["client-details", client_id],
    () =>
      axios
        .get<Client>(`${base_url}/api/clients/${client_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.data),
    { enabled: !!client_id }
  );

  // Query for communication logs
  const {
    data: communications,
    isLoading: loadingComm,
    error: errorComm
  } = useQuery<CommunicationLog[]>(
    ["client-communications", client_id],
    () =>
      axios
        .get<CommunicationLog[]>(`${base_url}/api/communication-logs`, {
          params: { client_id },
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.data),
    { enabled: !!client_id }
  );

  // Query for appointments
  const {
    data: appointments,
    isLoading: loadingAppt,
    error: errorAppt
  } = useQuery<Appointment[]>(
    ["client-appointments", client_id],
    () =>
      axios
        .get<Appointment[]>(`${base_url}/api/appointments`, {
          params: { client_id },
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.data),
    { enabled: !!client_id }
  );

  // Query for property interests
  const {
    data: propertyInterests,
    isLoading: loadingInterests,
    error: errorInterests
  } = useQuery<ClientPropertyInterest[]>(
    ["client-property-interests", client_id],
    () =>
      axios
        .get<ClientPropertyInterest[]>(`${base_url}/api/client-property-interests`, {
          params: { client_id },
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.data),
    { enabled: !!client_id }
  );

  // Query for client documents
  const {
    data: clientDocuments,
    isLoading: loadingDocs,
    error: errorDocs
  } = useQuery<ClientDocument[]>(
    ["client-documents", client_id],
    () =>
      axios
        .get<ClientDocument[]>(`${base_url}/api/client-documents`, {
          params: { client_id },
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.data),
    { enabled: !!client_id }
  );

  // Aggregate loading and error states
  const isLoading = loadingClient || loadingComm || loadingAppt || loadingInterests || loadingDocs;
  const error = errorClient || errorComm || errorAppt || errorInterests || errorDocs;

  // Initialize edited client state when client details are loaded
  useEffect(() => {
    if (clientDetails) {
      setEditedClient(clientDetails);
    }
  }, [clientDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedClient) {
      const { name, value } = e.target;
      setEditedClient({ ...editedClient, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!editedClient || !client_id) return;
    setUpdating(true);
    setUpdateError('');
    try {
      await axios.put(`${base_url}/api/clients/${client_id}`, editedClient, {
        headers: { Authorization: `Bearer ${token}` }
      });
      queryClient.invalidateQueries(['client-details', client_id]);
      setEditMode(false);
    } catch (err: any) {
      setUpdateError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setUpdateError('');
    if (clientDetails) {
      setEditedClient(clientDetails);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-lg font-semibold">Loading client profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-red-500 text-lg">
          Error fetching client profile: {error instanceof Error ? error.message : 'An error occurred'}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {clientDetails?.first_name} {clientDetails?.last_name}
        </h1>
        <div>
          {!editMode && (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="mr-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Edit Profile
            </button>
          )}
          <Link
            to={`/appointments/new?client_id=${client_id}`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Schedule Appointment
          </Link>
        </div>
      </div>
      {editMode ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Edit Personal Details</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="first_name"
                value={editedClient?.first_name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={editedClient?.last_name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={editedClient?.email || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input
                type="text"
                name="phone"
                value={editedClient?.phone || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={editedClient?.address || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <input
                type="text"
                name="status"
                value={editedClient?.status || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded p-2"
              />
            </div>
          </div>
          {updateError && <p className="text-red-500 mt-2">{updateError}</p>}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={updating}
              className="mr-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {updating ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Personal Details</h2>
            <p><strong>Email:</strong> {clientDetails?.email}</p>
            <p><strong>Phone:</strong> {clientDetails?.phone}</p>
            <p><strong>Address:</strong> {clientDetails?.address}</p>
            <p><strong>Status:</strong> {clientDetails?.status}</p>
            <div>
              <strong>Additional Details:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
                {JSON.stringify(clientDetails?.additional_details, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Property Interests</h2>
            {propertyInterests && propertyInterests.length > 0 ? (
              <ul className="list-disc pl-5">
                {propertyInterests.map((interest) => (
                  <li key={interest.id} className="mb-1">
                    <span className="font-medium">Type:</span> {interest.property_type} | 
                    <span className="font-medium ml-2">Location:</span> {interest.preferred_location} | 
                    <span className="font-medium ml-2">Price Range:</span> £{interest.price_min} - £{interest.price_max} | 
                    <span className="font-medium ml-2">Notes:</span> {interest.additional_notes}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No property interests found.</p>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Communication Log</h2>
            {communications && communications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {communications.map((log) => (
                  <li key={log.id} className="py-2">
                    <p>
                      <span className="font-medium">Type:</span> {log.communication_type} | 
                      <span className="font-medium ml-2">Note:</span> {log.note}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(log.timestamp).toLocaleString()} {log.follow_up_flag && <span className="text-red-500">(Follow Up)</span>}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No communication logs available.</p>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Appointment History</h2>
            {appointments && appointments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {appointments.map((appt) => (
                  <li key={appt.id} className="py-2">
                    <p>
                      <span className="font-medium">Date:</span> {appt.appointment_date} at {appt.appointment_time} | 
                      <span className="font-medium ml-2">Agent ID:</span> {appt.agent_id}
                    </p>
                    <p>
                      <span className="font-medium">Notes:</span> {appt.notes} | 
                      <span className="font-medium ml-2">Status:</span> {appt.is_confirmed ? 'Confirmed' : 'Pending'}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No appointments found.</p>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Document Repository</h2>
            {clientDocuments && clientDocuments.length > 0 ? (
              <ul className="list-disc pl-5">
                {clientDocuments.map((doc) => (
                  <li key={doc.id} className="mb-1">
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {doc.document_name}
                    </a> 
                    <span className="ml-2 text-sm text-gray-600">({doc.document_type}, uploaded on {doc.uploaded_at})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No documents available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UV_ClientProfile;