
-- Update get_seller_leaderboard to exclude shadow-banned users
CREATE OR REPLACE FUNCTION public.get_seller_leaderboard()
 RETURNS TABLE(display_name text, username text, avatar_url text, seller_tier integer, is_vip boolean, completed_sessions integer, total_earnings numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    p.display_name,
    p.username,
    p.avatar_url,
    p.seller_tier,
    p.is_vip,
    p.completed_sessions,
    COALESCE(SUM(s.platform_fee), 0)::numeric as total_earnings
  FROM public.profiles p
  LEFT JOIN public.sessions s ON s.shooter_id = p.user_id AND s.status = 'completed'
  WHERE p.seller_status = 'active'
    AND p.completed_sessions > 0
    AND COALESCE(p.is_shadow_banned, false) = false
  GROUP BY p.user_id, p.display_name, p.username, p.avatar_url, p.seller_tier, p.is_vip, p.completed_sessions
  ORDER BY p.completed_sessions DESC, total_earnings DESC
  LIMIT 50;
$$;
