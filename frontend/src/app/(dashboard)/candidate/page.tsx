import { redirect } from "next/navigation";

export default function CandidatePage() {
  // Redirect to the default candidate tab, e.g., profile or jobs
  redirect("/candidate/profile");
}
