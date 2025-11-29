import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const getUserIdFromToken = async () => {
  try {
    const cookieStore = await cookies(); // Await cookies in Next.js 15
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
};
