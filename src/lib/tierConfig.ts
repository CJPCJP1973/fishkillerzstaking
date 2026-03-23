export const RAKE_RATE = 0.05; // 5% for regular users
export const VIP_RAKE_RATE = 0.03; // 3% for VIP users
export const MAX_STAKE_PERCENT = 75; // Everyone capped at 75%

export function getRakeRate(isVip: boolean): number {
  return isVip ? VIP_RAKE_RATE : RAKE_RATE;
}
