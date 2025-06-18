import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

interface LoginForm {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
}

const UV_Login: React.FC = () => {
  const [login_form, setLoginForm] = useState<LoginForm>({ username: "", password: "" });
  const [login_error, setLoginError] = useState<string>("");
  const set_auth = useAppStore((state) => state.set_auth);
  const navigate = useNavigate();

  const loginMutation = useMutation<AuthResponse, any, LoginForm>(
    async (credentials: LoginForm) => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await axios.post(`${baseUrl}/api/auth/login`, credentials);
      return response.data;
    },
    {
      onSuccess: (data) => {
        set_auth({
          token: data.token,
          user: data.user,
          is_authenticated: true,
        });
        navigate("/dashboard");
      },
      onError: (error: any) => {
        if (error.response && error.response.data && error.response.data.message) {
          setLoginError(error.response.data.message);
        } else {
          setLoginError("An error occurred during login. Please try again.");
        }
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    loginMutation.mutate(login_form);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm({ ...login_form, [name]: value });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Login to UK EstateHub</h1>
          {login_error && <div className="mb-4 text-red-600 text-center">{login_error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={login_form.username}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={login_form.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex justify-between items-center mb-6">
              <Link to="/forgot-password" className="text-blue-500 hover:underline text-sm">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
              disabled={loginMutation.isLoading}
            >
              {loginMutation.isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_Login;