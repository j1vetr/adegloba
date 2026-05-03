import { ReactNode } from "react";
import UserShell from "@/components/UserShell";

// Backwards-compatible Layout that delegates to the new UserShell.
export function Layout({ children, title }: { children: ReactNode; title?: string }) {
  return <UserShell title={title}>{children}</UserShell>;
}

export default Layout;
