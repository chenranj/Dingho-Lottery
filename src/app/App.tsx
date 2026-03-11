import { useEffect, useState } from "react";
import { UserPage } from "./UserPage";
import { AdminPage } from "./AdminPage";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (path === "/dingho") {
    return <AdminPage />;
  }
  return <UserPage />;
}

export default App;
