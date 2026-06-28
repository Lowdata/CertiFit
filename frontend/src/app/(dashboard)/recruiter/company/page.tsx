"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Building2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyProfile {
  name: string;
  logo_url: string;
  website: string;
  industry: string;
  size: string;
  culture: string;
  benefits: string;
}

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    name: "",
    logo_url: "",
    website: "",
    industry: "",
    size: "",
    culture: "",
    benefits: "",
  });

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const res = await api.get("/company/me");
      setProfile(res.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        toast.error("Failed to load company profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/company/me", profile);
      toast.success("Company profile saved successfully.");
    } catch (err) {
      toast.error("Failed to save company profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          Company Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage your company's branding, culture, and information. Jobs posted by you will inherit these details.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                placeholder="Acme Corp"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={profile.logo_url || ""}
                onChange={(e) => setProfile({ ...profile, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={profile.website || ""}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>
              <Input
                value={profile.industry || ""}
                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                placeholder="e.g. Software, Finance, Healthcare"
              />
            </div>

            <div className="space-y-2">
              <Label>Company Size</Label>
              <Input
                value={profile.size || ""}
                onChange={(e) => setProfile({ ...profile, size: e.target.value })}
                placeholder="e.g. 1-10, 50-200, 1000+"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-6">
            <Label>Company Culture</Label>
            <Textarea
              value={profile.culture || ""}
              onChange={(e) => setProfile({ ...profile, culture: e.target.value })}
              placeholder="Describe your company culture, values, and mission..."
              className="h-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Benefits & Perks</Label>
            <Textarea
              value={profile.benefits || ""}
              onChange={(e) => setProfile({ ...profile, benefits: e.target.value })}
              placeholder="List the key benefits offered to employees..."
              className="h-32"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
