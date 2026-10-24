import { useState , useEffect } from 'react'
import client from '/home/aryan/Desktop/Event-Ticketing-and-Seat-Reservation-System/frontend/src/api/client.ts'


function App() {
  const [status,setStatus] = useState<string>("checking....");
  const [error,setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .get("/health")
      .then((res) => setStatus(res.data.status))
      .catch((err) => {
        setStatus("failed");
        setError(err.message);
      });
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">Event Ticketing</h1>
        <p>
          API health: <span className="font-mono">{status}</span>
        </p>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </>
  )
}

export default App
