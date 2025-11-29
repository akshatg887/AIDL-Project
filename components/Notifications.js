"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4000");

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch the current user to get their ID
    async function fetchUser() {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    // Only proceed if we have the current user's ID
    if (!currentUser) return;

    async function fetchNotifications() {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const { data } = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    }
    fetchNotifications();

    // Register with the socket server using the real user ID
    socket.emit("register", currentUser.userId);

    const handleReceiveNotification = (notificationData) => {
      setNotifications((prev) => [notificationData, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };
    socket.on("receiveNotification", handleReceiveNotification);

    return () => {
      socket.off("receiveNotification", handleReceiveNotification);
    };
  }, [currentUser]); // Re-run this effect when the user is fetched

  const handleToggle = async () => {
    setIsOpen(!isOpen);

    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0); // Immediately update the UI
      await fetch("/api/notifications/mark-read", {
        method: "POST",
      });
    }
  };

  return (
    <div className="relative flex flex-col">
      <button onClick={handleToggle} className="relative mx-1">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-3 right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-10">
          <div className="p-4 font-bold border-b">Notifications</div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <li
                  key={notif._id}
                  className="p-4 border-b hover:bg-gray-50 text-sm"
                >
                  <a href={notif.link || "#"}>{notif.message}</a>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
                No new notifications.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
