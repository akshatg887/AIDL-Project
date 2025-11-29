"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/users/logout");
      if (res.ok) {
        router.push("/login");
      } else {
        console.error("Failed to log out");
      }
    } catch (error) {
      console.error("An error occurred during logout:", error);
    }
  };

  return (
    <Button className="bg-indigo-950"
      onClick={handleLogout}
      
    >
      Log Out
    </Button>
  );
}
