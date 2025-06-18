import React, { useState } from "react";
import { useAppStore } from "@/store/main";

const GV_NotificationsPanel: React.FC = () => {
  // Local state to control the visibility of the notifications panel
  const [panelVisible, setPanelVisible] = useState<boolean>(false);
  // Global state: notifications list and actions to remove and clear notifications
  const { notifications, remove_notification: dismissNotification, clear_notifications: clearNotifications } = useAppStore((state) => ({
    notifications: state.notifications,
    remove_notification: state.remove_notification,
    clear_notifications: state.clear_notifications,
  }));

  // Action to toggle the notifications panel
  const toggleNotificationsPanel = (): void => {
    setPanelVisible((prev) => !prev);
  };

  // Render all HTML nodes in a single fragment
  return (
    <>
      {/* Notifications Icon: fixed at top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          className="relative inline-flex items-center p-2 bg-blue-600 text-white rounded-full focus:outline-none hover:bg-blue-700"
          onClick={toggleNotificationsPanel}
          aria-label="Toggle notifications panel"
        >
          <span role="img" aria-label="notifications">
            🔔
          </span>
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Panel Overlay */}
      {panelVisible && (
        <div className="fixed top-16 right-4 z-50 w-80 max-h-screen overflow-auto bg-white shadow-lg rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <button
              type="button"
              onClick={toggleNotificationsPanel}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Close notifications panel"
            >
              ×
            </button>
          </div>

          {/* If there are no notifications, show a message */}
          {notifications.length === 0 ? (
            <div className="text-gray-500">No notifications</div>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li key={notification.id} className="mb-2 p-2 border border-gray-200 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissNotification(notification.id)}
                      className="text-red-500 hover:text-red-700 ml-2 focus:outline-none"
                      aria-label="Dismiss notification"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Clear All button appears if there is at least one notification */}
          {notifications.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={clearNotifications}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-1 rounded focus:outline-none"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GV_NotificationsPanel;