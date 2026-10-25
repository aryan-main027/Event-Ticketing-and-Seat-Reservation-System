import { useEffect, useState } from "react";

// Returns the seconds left until `target`, updating every second.
export function useCountdown(target: string | null): number {
  const calc = () =>
    target ? Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)) : 0;

  const [secondsLeft, setSecondsLeft] = useState(calc);

  useEffect(() => {
    setSecondsLeft(calc());
    const timer = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return secondsLeft;
}