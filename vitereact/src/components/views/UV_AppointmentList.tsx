import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from '@/store/main';

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

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  appointmentId: string;
}

interface FilterCriteria {
  client_id: string;
  agent_id: string;
  date: string;
  limit: number;
  offset: number;
}

const UV_AppointmentList: React.FC = () => {
  // Retrieve URL query parameters for filtering
  const [searchParams] = useSearchParams();
  const initialFilter: FilterCriteria = {
    client_id: searchParams.get("client_id") || "",
    agent_id: searchParams.get("agent_id") || "",
    date: searchParams.get("date") || "",
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 10,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset") as string) : 0,
  };

  // Local state for filter criteria and selected appointment (for details modal)
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(initialFilter);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Update filterCriteria when URL search parameters change
  useEffect(() => {
    const newFilter: FilterCriteria = {
      client_id: searchParams.get('client_id') || '',
      agent_id: searchParams.get('agent_id') || '',
      date: searchParams.get('date') || '',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit') as string, 10) : 10,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset') as string, 10) : 0
    };
    setFilterCriteria(newFilter);
  }, [searchParams]);

  // Get global auth state from Zustand store
  const auth = useAppStore((state) => state.auth);

  // Fetch appointments using react-query
  const fetchAppointments = async (): Promise<Appointment[]> => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await axios.get<Appointment[]>(`${baseURL}/api/appointments`, {
      params: filterCriteria,
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    return response.data;
  };

  const { data: appointments, isLoading, isError, error } = useQuery<Appointment[], Error>(
    ['appointments', filterCriteria],
    fetchAppointments
  );

  // transformToCalendarData: transform appointments into calendar events
  const calendarData: CalendarEvent[] = useMemo(() => {
    if (!appointments) return [];
    return appointments.map(app => {
      // Combine appointment date and time to create a start Date
      const startDate = new Date(`${app.appointment_date}T${app.appointment_time}`);
      // Set end date to one hour later as a default duration
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      return {
        title: app.notes ? app.notes : "Appointment", // use notes if available, else default
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        appointmentId: app.id
      };
    });
  }, [appointments]);

  // Action: Open appointment details modal when an event is clicked
  const openAppointmentDetails = (appointmentId: string) => {
    if (!appointments) return;
    const found = appointments.find(app => app.id === appointmentId);
    if (found) {
      setSelectedAppointment(found);
    }
  };

  const handleKeyDown = (appointmentId: string, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      openAppointmentDetails(appointmentId);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Appointment & Calendar View</h1>
      <div className="mb-4">
        <Link to="/appointments/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create New Appointment
        </Link>
      </div>

      {isLoading && (
        <div className="text-center text-gray-600">Loading appointments...</div>
      )}
      {isError && (
        <div className="text-center text-red-600">Error: {error?.message}</div>
      )}

      {!isLoading && appointments && (
        <>
          {/* Calendar Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Calendar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {calendarData.length > 0 ? (
                calendarData.map(event => (
                  <div 
                    key={event.appointmentId} 
                    role="button"
                    tabIndex={0}
                    onClick={() => openAppointmentDetails(event.appointmentId)}
                    onKeyDown={(e) => handleKeyDown(event.appointmentId, e)}
                    className="p-4 border rounded shadow hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-gray-600">Start: {new Date(event.start).toLocaleString("en-GB")}</p>
                    <p className="text-sm text-gray-600">End: {new Date(event.end).toLocaleString("en-GB")}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-gray-500">No calendar events available.</div>
              )}
            </div>
          </div>

          {/* List Section */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Appointment List</h2>
            {appointments.length > 0 ? (
              <table className="min-w-full border">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Time</th>
                    <th className="px-4 py-2 border">Client ID</th>
                    <th className="px-4 py-2 border">Agent ID</th>
                    <th className="px-4 py-2 border">Notes</th>
                    <th className="px-4 py-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(app => (
                    <tr 
                      key={app.id} 
                      role="button"
                      tabIndex={0}
                      onClick={() => openAppointmentDetails(app.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') openAppointmentDetails(app.id); }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-2 border">{app.appointment_date}</td>
                      <td className="px-4 py-2 border">{app.appointment_time}</td>
                      <td className="px-4 py-2 border">{app.client_id}</td>
                      <td className="px-4 py-2 border">{app.agent_id}</td>
                      <td className="px-4 py-2 border">{app.notes}</td>
                      <td className="px-4 py-2 border">{app.is_confirmed ? "Confirmed" : "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No appointments found.</p>
            )}
          </div>
        </>
      )}

      {/* Modal for Appointment Details */}
      {selectedAppointment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-1/2">
            <h3 id="appointment-details-title" className="text-xl font-bold mb-4">Appointment Details</h3>
            <ul className="mb-4">
              <li><span className="font-semibold">Appointment ID:</span> {selectedAppointment.id}</li>
              <li><span className="font-semibold">Client ID:</span> {selectedAppointment.client_id}</li>
              <li><span className="font-semibold">Agent ID:</span> {selectedAppointment.agent_id}</li>
              <li>
                <span className="font-semibold">Date &amp; Time:</span>{" "}
                {selectedAppointment.appointment_date} at {selectedAppointment.appointment_time}
              </li>
              <li><span className="font-semibold">Notes:</span> {selectedAppointment.notes}</li>
              <li>
                <span className="font-semibold">Status:</span>{" "}
                {selectedAppointment.is_confirmed ? "Confirmed" : "Pending"}
              </li>
            </ul>
            <button type="button" className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={() => setSelectedAppointment(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UV_AppointmentList;