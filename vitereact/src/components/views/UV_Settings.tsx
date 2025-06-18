import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useAppStore } from "@/store/main";

interface SettingsFormType {
  dashboard_preferences: {
    theme?: string;
    layout?: string;
  };
  notification_settings: {
    email?: boolean;
    in_app?: boolean;
  };
  configuration: {
    language?: string;
  };
}

interface UserSettingsResponse {
  id: string;
  user_id: string;
  dashboard_preferences: Record<string, any>;
  notification_settings: Record<string, any>;
  configuration: Record<string, any>;
  updated_at: string;
}

const UV_Settings: React.FC = () => {
  // Extract the user_id from route parameters
  const { user_id } = useParams<{ user_id: string }>();
  // Access global user_settings and auth from the store
  const globalSettings = useAppStore((state) => state.user_settings);
  const updateUserSettingsStore = useAppStore((state) => state.update_user_settings);
  const auth = useAppStore((state) => state.auth);

  // Local state for the settings form, saving indicator and error messages.
  const initialFormState: SettingsFormType = {
    dashboard_preferences: {
      theme: globalSettings.dashboard_preferences?.theme || '',
      layout: globalSettings.dashboard_preferences?.layout || '',
    },
    notification_settings: {
      email: globalSettings.notification_settings?.email || false,
      in_app: globalSettings.notification_settings?.in_app || false,
    },
    configuration: {
      language: globalSettings.configuration?.language || '',
    },
  };
  const [settingsForm, setSettingsForm] = useState<SettingsFormType>(initialFormState);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");

  // Reset the local state when the global settings change
  useEffect(() => {
    setSettingsForm({
      dashboard_preferences: {
        theme: globalSettings.dashboard_preferences?.theme || '',
        layout: globalSettings.dashboard_preferences?.layout || '',
      },
      notification_settings: {
        email: globalSettings.notification_settings?.email || false,
        in_app: globalSettings.notification_settings?.in_app || false,
      },
      configuration: {
        language: globalSettings.configuration?.language || '',
      },
    });
  }, [globalSettings]);

  if (!user_id) {
    return <div>User ID not provided in URL.</div>;;
  }

  // Function to call backend endpoint to update user settings
  const updateSettings = async (formData: SettingsFormType): Promise<UserSettingsResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const response = await axios.put(
      `${baseUrl}/api/user-settings/${user_id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      }
    );
    return response.data;
  };

  // Set up the mutation using react-query
  const mutation = useMutation<UserSettingsResponse, AxiosError, SettingsFormType>(updateSettings);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    mutation.mutate(settingsForm, {
      onSuccess: (data) => {
        setIsSaving(false);
        // On success, update the global state with the saved settings
        updateUserSettingsStore({
          dashboard_preferences: data.dashboard_preferences,
          notification_settings: data.notification_settings,
          configuration: data.configuration
        });
      },
      onError: (error: AxiosError) => {
        setIsSaving(false);
        setSaveError(error.response?.data?.message || "Error saving settings");
      }
    });
  };

  const handleReset = () => {
    // Reset the form to the latest saved global settings
    setSettingsForm({
      dashboard_preferences: {
        theme: globalSettings.dashboard_preferences?.theme || '',
        layout: globalSettings.dashboard_preferences?.layout || '',
      },
      notification_settings: {
        email: globalSettings.notification_settings?.email || false,
        in_app: globalSettings.notification_settings?.in_app || false,
      },
      configuration: {
        language: globalSettings.configuration?.language || '',
      },
    });
    setSaveError("");
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Settings &amp; Configurations</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Dashboard Preferences</h2>
          <div className="mb-4">
            <label htmlFor="dashboard-theme" className="block text-sm font-medium">Theme</label>
            <input
              id="dashboard-theme"
              type="text"
              value={settingsForm.dashboard_preferences.theme || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dashboard_preferences: {
                    ...settingsForm.dashboard_preferences,
                    theme: e.target.value
                  }
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Enter theme (e.g., dark, light)"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="dashboard-layout" className="block text-sm font-medium">Layout</label>
            <input
              id="dashboard-layout"
              type="text"
              value={settingsForm.dashboard_preferences.layout || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  dashboard_preferences: {
                    ...settingsForm.dashboard_preferences,
                    layout: e.target.value
                  }
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Enter layout (e.g., grid, list)"
            />
          </div>
        </div>
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Notification Settings</h2>
          <div className="mb-4 flex items-center">
            <input
              id="notification-email"
              type="checkbox"
              checked={settingsForm.notification_settings.email || false}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  notification_settings: {
                    ...settingsForm.notification_settings,
                    email: e.target.checked
                  }
                })
              }
              className="mr-2"
            />
            <label htmlFor="notification-email" className="text-sm">Email Notifications</label>
          </div>
          <div className="mb-4 flex items-center">
            <input
              id="notification-inapp"
              type="checkbox"
              checked={settingsForm.notification_settings.in_app || false}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  notification_settings: {
                    ...settingsForm.notification_settings,
                    in_app: e.target.checked
                  }
                })
              }
              className="mr-2"
            />
            <label htmlFor="notification-inapp" className="text-sm">In App Notifications</label>
          </div>
        </div>
        <div className="border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Regional Configuration</h2>
          <div className="mb-4">
            <label htmlFor="configuration-language" className="block text-sm font-medium">Language</label>
            <input
              id="configuration-language"
              type="text"
              value={settingsForm.configuration.language || ""}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  configuration: {
                    ...settingsForm.configuration,
                    language: e.target.value
                  }
                })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Enter language (e.g., en-UK)"
            />
          </div>
        </div>
        {saveError && (
          <div className="text-red-600 font-medium">
            {saveError}
          </div>
        )}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>
      </form>
    </>
  );
};

export default UV_Settings;