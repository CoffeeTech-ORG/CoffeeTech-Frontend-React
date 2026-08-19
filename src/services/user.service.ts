import { api } from './api.service';

/** The current phone state for a user, as returned by the phone endpoints. */
export interface UserPhone {
  userId: number;
  phoneNumber: string | null;
  phoneVerified: boolean;
  smsOptIn: boolean;
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
}

export const userService = {
  /** Updates the account name and email. Rejects with the HTTP status on conflict/validation errors. */
  async updateProfile(userId: number, username: string, email: string): Promise<UserAccount> {
    const res = await api.put(`/users/${userId}`, { username, email });
    return res.data;
  },

  async getPhone(userId: number): Promise<UserPhone> {
    const res = await api.get(`/users/${userId}/phone`);
    return res.data;
  },

  /** Saves the number and opt-in. A changed number always drops back to unverified on the backend. */
  async setPhone(userId: number, phoneNumber: string | null, smsOptIn: boolean): Promise<UserPhone> {
    const res = await api.put(`/users/${userId}/phone`, { phoneNumber, smsOptIn });
    return res.data;
  },

  /** Asks the backend to text a one-time code to the number on file. */
  async requestCode(userId: number): Promise<void> {
    await api.post(`/users/${userId}/phone/request-code`);
  },

  /** Confirms the number with the code. Resolves on success; rejects (with the HTTP status) otherwise. */
  async verifyCode(userId: number, code: string): Promise<UserPhone> {
    const res = await api.post(`/users/${userId}/phone/verify`, { code });
    return res.data;
  },
};
