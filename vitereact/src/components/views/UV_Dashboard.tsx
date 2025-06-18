import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

interface DashboardData {
  total_clients: number;
  upcoming_appointments: number;
  recent_activity: Array<{
    id: string;
    note: string;
    timestamp: string;
  }>;
  charts: {
    monthly_clients: number[];
  };
}

const UV_Dashboard: React.FC = () => {
  const auth = useAppStore((state) => state.auth);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const fetchDashboardData = async (): Promise<DashboardData> => {
    // Define promises for API requests
    const clientsPromise = axios.get(`${API_BASE_URL}/api/clients`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      params: { limit: 10000 } // retrieve sufficient clients for aggregate
    });
    const appointmentsPromise = axios.get(`${API_BASE_URL}/api/appointments`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      params: { limit: 10000 }
    });
    const logsPromise = axios.get(`${API_BASE_URL}/api/communication-logs`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      params: { limit: 10 }
    });

    // Execute all requests concurrently
    const [clientsRes, appointmentsRes, logsRes] = await Promise.all([
      clientsPromise,
      appointmentsPromise,
      logsPromise,
    ]);

    const clients = clientsRes.data as any[];
    const appointments = appointmentsRes.data as any[];
    const logs = logsRes.data as any[];

    // Compute total clients
    const total_clients = clients.length;

    // Compute upcoming appointments: appointments whose appointment_date is later than now
    const now = new Date();
    const upcoming_appointments = appointments.filter((appt) => {
      const apptDate = new Date(appt.appointment_date);
      return apptDate >= now;
    }).length;

    // Process recent activity from communication logs; sort logs descending by timestamp and take top 5
    const sorted_logs = logs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const recent_activity = sorted_logs.slice(0, 5).map((log: any) => ({
      id: log.id,
      note: `${log.communication_type}: ${log.note}`,
      timestamp: log.timestamp,
    }));

    // Compute monthly_clients chart for the last 12 months
    const monthly_clients = new Array(12).fill(0);
    const currentDate = new Date();
    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}`;
      monthKeys.push(key);
    }
    // Aggregate client registrations by month using client.created_at
    clients.forEach((client) => {
      const date = new Date(client.created_at);
      const key = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}`;
      const index = monthKeys.indexOf(key);
      if (index !== -1) {
        monthly_clients[index]++;
      }
    });

    return {
      total_clients,
      upcoming_appointments,
      recent_activity,
      charts: { monthly_clients },
    };
  };

  const { data, error, isLoading } = useQuery<DashboardData, Error>(
    [ "dashboardData", auth.token ],
    fetchDashboardData,
    { refetchInterval: 60000 }
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {isLoading && (
        <div className="flex items-center justify-center" aria-busy="true">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error.message}
        </div>
      )}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-lg font-semibold mb-2">Total Clients</h2>
            <p className="text-3xl">{data.total_clients}</p>
          </div>
          <div className="bg-white shadow rounded p-6">
            <h2 className="text-lg font-semibold mb-2">Upcoming Appointments</h2>
            <p className="text-3xl">{data.upcoming_appointments}</p>
          </div>
          <div className="bg-white shadow rounded p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
            {data.recent_activity.length === 0 ? (
              <p>No recent activity found.</p>
            ) : (
              <ul>
                {data.recent_activity.map((activity) => (
                  <li key={activity.id} className="border-b py-2">
                    <p className="text-sm">{activity.note}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white shadow rounded p-6 md:col-span-2">
            <h2 className="text-lg font-semibold mb-2">Monthly Clients Chart</h2>
            <div className="flex items-end space-x-2 h-32">
              {data.charts.monthly_clients.map((count, index) => {
                const curDate = new Date();
                const monthDate = new Date(curDate.getFullYear(), curDate.getMonth() - (11 - index), 1);
                const monthLabel = monthDate.toLocaleString("default", { month: "short" });
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      role="img"
                      aria-label={`Month ${monthLabel}: ${count} clients`}
                      className="bg-blue-500 w-4"
                      style={{ height: `${count * 5}px` }}
                    ></div>
                    <span className="text-xs mt-1">{monthLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/clients"
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-center"
        >
          View Clients
        </Link>
        <Link
          to="/appointments/new"
          className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded text-center"
        >
          Schedule Appointment
        </Link>
        <Link
          to="/reports"
          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded text-center"
        >
          Manager Reports
        </Link>
      </div>
    </div>
  );
};

export default UV_Dashboard;