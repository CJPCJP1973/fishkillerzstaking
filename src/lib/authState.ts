export interface UserProfileState {
  sellerStatus: string;
  sellerPaid: boolean;
  username: string | null;
  verificationStatus: string;
  verificationNote: string | null;
  isVip: boolean;
  completedSessions: number;
}

export const defaultUserProfileState: UserProfileState = {
  sellerStatus: "none",
  sellerPaid: false,
  username: null,
  verificationStatus: "none",
  verificationNote: null,
  isVip: false,
  completedSessions: 0,
};