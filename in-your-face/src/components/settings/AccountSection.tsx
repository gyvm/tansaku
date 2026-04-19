import { useAuthStore } from "../../stores/authStore";

export default function AccountSection() {
  const { isAuthenticated, login, logout } = useAuthStore();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Account</h2>
      {isAuthenticated ? (
        <div className="flex items-center gap-4">
          <span className="text-green-600">Google Calendar connected</span>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect Google Calendar
        </button>
      )}
    </section>
  );
}
