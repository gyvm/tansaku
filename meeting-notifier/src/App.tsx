import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import SettingsPage from "./pages/SettingsPage";

type Page = "main" | "settings";

function App() {
  const { auth, loading, login, logout } = useAuth();
  const [page, setPage] = useState<Page>("main");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Meeting Notifier</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page === "main" ? "settings" : "main")}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            {page === "main" ? "Settings" : "Back"}
          </button>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </header>
      {page === "main" ? (
        <MainPage userEmail={auth.userEmail} />
      ) : (
        <SettingsPage />
      )}
    </div>
  );
}

export default App;
