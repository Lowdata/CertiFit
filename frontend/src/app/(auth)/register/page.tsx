"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, User, Briefcase } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<1 | 2>(2);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({ name, email, password, user_type: userType });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2">Create your account</h2>
        <p className="text-sm text-slate-500">Start building an evidence-backed candidate profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full h-11 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-colors"
            required
            disabled={loading}
          />
        </div>

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

        <div className="space-y-3 pt-1">
          <Label className="text-sm font-medium text-slate-700">I am a</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType(2)}
              disabled={loading}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                userType === 2
                  ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <User className={`w-4 h-4 ${userType === 2 ? "text-blue-600" : "text-slate-400"}`} />
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setUserType(1)}
              disabled={loading}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                userType === 1
                  ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Briefcase className={`w-4 h-4 ${userType === 1 ? "text-blue-600" : "text-slate-400"}`} />
              Recruiter
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-lg mt-2">
            <p className="text-sm text-amber-600 font-medium">{error}</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        <div className="pt-4 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}