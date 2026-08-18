import { useCallback, useEffect, useState } from 'react';
import { userService, UserPhone } from '../services/user.service';

/** Loads a user's phone state and exposes a reload for after a save or verification. */
export function useUserPhone(userId: number | undefined) {
  const [phone, setPhone] = useState<UserPhone | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setPhone(await userService.getPhone(userId));
    } catch {
      setPhone(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { phone, loading, reload };
}
