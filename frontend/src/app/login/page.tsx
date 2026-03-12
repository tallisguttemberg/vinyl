"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const loginMutation = api.user.login.useMutation({
        onSuccess: (data) => {
            // Set session token (using the returned user ID as token)
            localStorage.setItem("vinyl-token", data.token);
            // Set a cookie for the middleware to read
            document.cookie = `vinyl-session=${data.token}; path=/`;
            router.push("/");
        },
        onError: (err) => {
            setError(err.message || "Invalid username or password");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        loginMutation.mutate({ usuario: username, senha: password });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-gray-800 p-10 rounded-xl shadow-2xl border border-gray-700">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
                        Vinyl Admin
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Enter your credentials to access the dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                placeholder="Username"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm pr-10"
                                placeholder="Password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none focus:z-20"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
