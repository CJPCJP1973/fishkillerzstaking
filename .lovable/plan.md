

## Refactor: User System, Seller Upgrade, Payment Profiles, Unified Dashboard

### Summary

Replace the current "shooter/backer" role system with a simpler model: everyone signs up as a standard **User** with a unique **username**. Users can upgrade to **Seller** status by paying a registration fee, which the Admin manually verifies. A unified dashboard adapts based on the user's role.

---

### 1. Database Changes (Migration)

**A. Add `username` column to `profiles`:**
- Add unique `username TEXT NOT NULL` column (with a default of the email prefix to avoid breaking existing rows)
- Add unique constraint on `username`

**B. Add Seller status to `profiles`:**
- Add `seller_status TEXT DEFAULT 'none'` — values: `none`, `pending`, `active`
- This replaces the need for a separate "shooter" role for gating session creation

**C. Add `payment_profiles` table:**
```
payment_profiles (
  id UUID PK,
  user_id UUID NOT NULL (references auth.users ON DELETE CASCADE),
  cashapp_tag TEXT,
  venmo_username TEXT,
  chime_handle TEXT,
  btc_address TEXT,
  btc_lightning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```
- RLS: users can read/update their own row; admins can read all
- Trigger to auto-create a row on signup

**D. Add `seller_requests` table:**
```
seller_requests (
  id UUID PK,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | approved | rejected
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT
)
```
- RLS: users can insert/read own; admins can read/update all

**E. Update `app_role` enum:**
- Keep `admin`, `backer` (now just the default "user" role), add `seller` to replace `shooter`
- Or simpler: keep the enum but rename `shooter` conceptually — since renaming enums is complex, we'll add `seller` as a new enum value and use it going forward. The `shooter` value stays for backward compat but new code uses `seller`.

**F. Update `handle_new_user()` trigger:**
- Auto-create `payment_profiles` row
- Set default role to `backer` (standard user)
- For admin email: also assign `admin` and `seller`

---

### 2. Auth / Signup Changes

**`Auth.tsx`:** Add a `username` field to signup form (required, validated for uniqueness). Store in `user_metadata` and `profiles.username`.

---

### 3. Profile Page Refactor (`Profile.tsx`)

- Show username prominently
- If `seller_status === 'none'`: show **"Become a Seller"** CTA button with fee info
- If `seller_status === 'pending'`: show "Pending Verification" badge
- If `seller_status === 'active'`: show "Verified Seller" badge
- Add **Payment Settings** section to save CashApp, Venmo, Chime, BTC, BTC Lightning

---

### 4. Seller Upgrade Flow

- **"Become a Seller" button** on profile → opens a modal/dialog explaining the fee and payment instructions (CashApp/Venmo/Chime to admin)
- On click "I've Paid": inserts a row into `seller_requests` and sets `profiles.seller_status = 'pending'`
- **Admin Panel** gets a new "Pending Sellers" section showing requests, with Approve/Reject buttons
- On Approve: admin sets `seller_requests.status = 'approved'`, `profiles.seller_status = 'active'`, and inserts `seller` role into `user_roles`

---

### 5. Unified Dashboard (`Profile.tsx` or new `Dashboard.tsx`)

Restructure the Profile/Dashboard into tabs or sections:
- **All users:** "My Stakes" (staked sessions list), "Transaction History"
- **Sellers only:** "Create Session" tools, "My Sessions" list
- **Navigation:** Replace "Create" nav item — only show if user is a seller; otherwise direct to profile with upgrade prompt

---

### 6. Layout & Navigation Updates

- Rename "Shooter" references to "Seller" throughout
- `Layout.tsx`: Show "Create" nav link only if user has `seller` role or `seller_status === 'active'`
- Update `useAuth` hook: add `isSeller` computed from roles, keep `isAdmin`

---

### 7. Admin Panel Updates (`Admin.tsx`)

Add a **"Pending Sellers"** tab/section:
- List all `seller_requests` with `status = 'pending'`
- Show user info (username, email, payment profiles)
- Approve / Reject buttons that update the DB

---

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create: `payment_profiles`, `seller_requests` tables, add `username` & `seller_status` to profiles, add `seller` enum value |
| `src/pages/Auth.tsx` | Add username field to signup |
| `src/hooks/useAuth.tsx` | Add `isSeller` (replacing `isShooter`), fetch seller_status |
| `src/pages/Profile.tsx` | Major refactor: unified dashboard, payment settings, seller upgrade CTA |
| `src/components/BecomeSeller.tsx` | New: seller upgrade dialog with payment instructions |
| `src/components/PaymentSettings.tsx` | New: form to save payout info |
| `src/components/Layout.tsx` | Update nav: "Create" only for sellers |
| `src/pages/Admin.tsx` | Add pending sellers section with approve/reject |
| `src/pages/CreateSession.tsx` | Gate behind seller status check |
| `src/components/CreateSessionForm.tsx` | Minor: auto-fill shooter name from profile |

