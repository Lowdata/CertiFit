"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Welcome back</h2>
        <p className="text-sm text-slate-500">Sign in to continue hiring with confidence.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-11 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-colors"
            required
            disabled={loading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-11 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-colors"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-lg">
            <p className="text-sm text-amber-600 font-medium">{error}</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
        
        <div className="pt-4 text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}