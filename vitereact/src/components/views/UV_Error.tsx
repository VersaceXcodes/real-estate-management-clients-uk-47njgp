import React, { useState } from "react";
import { useAppStore } from "@/store/main";
import { Link } from "react-router-dom";

interface ErrorState {
  errorMessage: string;
  errorType: string;
  details: string;
  isVisible: boolean;
}

const UV_Error: React.FC = () => {
  // Local error state as defined in the datamap for UV_Error
  const [errorState, setErrorState] = useState<ErrorState>({
    errorMessage: "",
    errorType: "error",
    details: "",
    isVisible: false,
  });

  // Access the global store's add_notification method
  const add_notification = useAppStore((state) => state.add_notification);

  // Handler for dismissing the error
  const dismissError = () => {
    setErrorState((prev) => ({ ...prev, isVisible: false }));
  };

  // Handler for retry action; here we simply dismiss the error and add a notification indicating retry was triggered.
  const retryAction = () => {
    setErrorState((prev) => ({ ...prev, isVisible: false }));
    // Create a simple notification for retry action
    add_notification({
      id: `notif-${Date.now()}`,
      type: "info",
      message: "Retry action triggered.",
      timestamp: new Date().toISOString(),
    });
    // Optionally, invoke any retry logic here (e.g., re-calling a failed API mutation)
  };

  return (
    <>
      {errorState.isVisible && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {errorState.errorMessage}
            </h2>
            {errorState.details && (
              <p className="mb-4 text-gray-700">{errorState.details}</p>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={dismissError}
                aria-label="Dismiss error"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Dismiss
              </button>
              {errorState.errorType === "recoverable" && (
                <button
                  onClick={retryAction}
                  aria-label="Retry action"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              )}
            </div>
            {/* Optionally, provide a link to redirect to Dashboard or another safe route */}
            <div className="mt-4">
              <Link
                to="/dashboard"
                className="text-blue-500 hover:underline"
                aria-label="Go to Dashboard"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_Error;