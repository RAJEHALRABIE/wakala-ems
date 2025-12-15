import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const hasAccess = localStorage.getItem("wakala_access");
    if (hasAccess === "granted") {
      setLocation("/dashboard");
    } else {
      setLocation("/login");
    }
  }, [setLocation]);

  return null;
}
