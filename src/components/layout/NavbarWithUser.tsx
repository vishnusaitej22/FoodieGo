import { getCurrentUser } from "@/lib/auth";
import Navbar from "./Navbar";

// Looks up the logged-in user on the server, then shows the navbar.
export default async function NavbarWithUser() {
  const user = await getCurrentUser();
  return (
    <Navbar
      user={user ? { fullName: user.fullName, email: user.email } : null}
    />
  );
}
