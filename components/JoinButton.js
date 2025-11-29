"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import PropTypes from "prop-types";

export default function JoinButton({ projectId }) {
  const router = useRouter();

  const handleJoinRequest = async () => {
    // This check prevents the "undefined" URL
    if (!projectId) {
      console.error("JoinButton: projectId is missing!");
      return;
    }

    const res = await fetch(`/api/projects/${projectId}/join`, {
      method: "POST",
    });

    if (res.ok) {
      toast("Your request to join has been sent!", {
        action: {
          label: "Okay",
          onClick: () => {
            console.log("Okay");
          },
        },
      });
    } else if (res.status === 401) {
      toast("Please log in to request to join a project.", {
        action: {
          label: "Okay",
          onClick: () => {
            console.log("Okay");
          },
        },
      });
      router.push("/login");
    } else {
      const { error } = await res.json();
      toast(`Error: ${error || "Failed to send join request."}`, {
        action: {
          label: "Okay",
          onClick: () => {
            console.log("Okay");
          },
        },
      });
    }
  };

  return (
    <Button
      onClick={handleJoinRequest}
      className="bg-green-900"
      disabled={!projectId} // Disable the button if the ID is missing
    >
      Request to Join Project
    </Button>
  );
}

JoinButton.propTypes = {
  projectId: PropTypes.string.isRequired,
};
