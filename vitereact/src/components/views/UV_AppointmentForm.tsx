import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from "@/store/main";

interface AppointmentFormState {
  client_id: string;
  property_id: string;
  agent_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
  is_confirmed: boolean;
}

interface AppointmentResponse {
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

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface Property {
  id: string;
  address: string;
}

interface User {
  id: string;
  username: string;
  role: string;
}

const UV_AppointmentForm: React.FC = () => {
  const { appointment_id } = useParams<{ appointment_id?: string }>();
  const auth = useAppStore((state) => state.auth);
  const addNotification = useAppStore((state) => state.add_notification);
  const queryClient = useQueryClient();

  // Local appointment form state and error handling
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>({
    client_id: "",
    property_id: "",
    agent_id: "",
    appointment_date: "",
    appointment_time: "",
    notes: "",
    is_confirmed: false,
  });
  const [errors, setErrors] = useState<Partial<AppointmentFormState>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Fetch appointment details if editing
  const { data: appointmentData } = useQuery<AppointmentResponse>(
    ["appointment", appointment_id],
    () =>
      axios
        .get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/appointments/${appointment_id}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        )
        .then((res) => res.data),
    { enabled: !!appointment_id }
  );
  useEffect(() => {
    if (appointmentData) {
      setAppointmentForm({
        client_id: appointmentData.client_id,
        property_id: appointmentData.property_id || "",
        agent_id: appointmentData.agent_id,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        notes: appointmentData.notes,
        is_confirmed: appointmentData.is_confirmed,
      });
    }
  }, [appointmentData]);

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery<Client[]>(
    ["clients"],
    () =>
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/clients`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        .then((res) => res.data)
  );

  // Fetch properties for dropdown
  const { data: propertiesData } = useQuery<Property[]>(
    ["properties"],
    () =>
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/properties`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        .then((res) => res.data)
  );

  // Fetch users and filter agents
  const { data: usersData } = useQuery<User[]>(
    ["agents"],
    () =>
      axios
        .get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/users`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        })
        .then((res) => res.data.filter((user: User) => user.role === "agent"))
  );

  // Real-time form validation
  const validateForm = () => {
    const newErrors: Partial<AppointmentFormState> = {};
    if (!appointmentForm.client_id) newErrors.client_id = "Client is required.";
    if (!appointmentForm.agent_id) newErrors.agent_id = "Agent is required.";
    if (!appointmentForm.appointment_date)
      newErrors.appointment_date = "Appointment date is required.";
    if (!appointmentForm.appointment_time)
      newErrors.appointment_time = "Appointment time is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mutation for creating/updating appointment
  const mutation = useMutation<AppointmentResponse, Error, AppointmentFormState>(
    (formData) => {
      if (appointment_id) {
        // Update existing appointment
        return axios
          .put(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/appointments/${appointment_id}`,
            formData,
            { headers: { Authorization: `Bearer ${auth.token}` } }
          )
          .then((res) => res.data);
      } else {
        // Create new appointment
        return axios
          .post(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/appointments`,
            formData,
            { headers: { Authorization: `Bearer ${auth.token}` } }
          )
          .then((res) => res.data);
      }
    },
    {
      onSuccess: () => {
        // Invalidate appointments list and show notification on success
        queryClient.invalidateQueries(["appointments"]);
        addNotification({
          id: new Date().getTime().toString(),
          type: "success",
          message: "Appointment scheduled successfully.",
          timestamp: new Date().toISOString(),
        });
      },
      onError: (error: any) => {
        setSubmitError(error.message || "Submission failed.");
      },
    }
  );

  // Handle form field changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setAppointmentForm((prev) => ({ ...prev, [name]: fieldValue }));
    // Validate every input change
    validateForm();
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (validateForm()) {
      mutation.mutate(appointmentForm);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4">
          {appointment_id ? "Edit Appointment" : "New Appointment"}
        </h1>
        {submitError && <div className="mb-4 text-red-500">{submitError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="client_id">
              Client
            </label>
            <select
              id="client_id"
              name="client_id"
              value={appointmentForm.client_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Client</option>
              {clientsData &&
                clientsData.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
            </select>
            {errors.client_id && (
              <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="property_id">
              Property (Optional)
            </label>
            <select
              id="property_id"
              name="property_id"
              value={appointmentForm.property_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Property</option>
              {propertiesData &&
                propertiesData.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="agent_id">
              Agent
            </label>
            <select
              id="agent_id"
              name="agent_id"
              value={appointmentForm.agent_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Agent</option>
              {usersData &&
                usersData.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.username}
                  </option>
                ))}
            </select>
            {errors.agent_id && (
              <p className="text-red-500 text-xs mt-1">{errors.agent_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="appointment_date">
              Appointment Date
            </label>
            <input
              type="date"
              id="appointment_date"
              name="appointment_date"
              value={appointmentForm.appointment_date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
            {errors.appointment_date && (
              <p className="text-red-500 text-xs mt-1">{errors.appointment_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="appointment_time">
              Appointment Time
            </label>
            <input
              type="time"
              id="appointment_time"
              name="appointment_time"
              value={appointmentForm.appointment_time}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
            {errors.appointment_time && (
              <p className="text-red-500 text-xs mt-1">{errors.appointment_time}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={appointmentForm.notes}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_confirmed"
              name="is_confirmed"
              checked={appointmentForm.is_confirmed}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label htmlFor="is_confirmed" className="text-sm">
              Confirmed
            </label>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            >
              {appointment_id ? "Update Appointment" : "Schedule Appointment"}
            </button>
            <Link to="/appointments" className="text-blue-600 hover:underline">
              Back to Appointments
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_AppointmentForm;