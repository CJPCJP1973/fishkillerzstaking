
DROP FUNCTION public.get_public_sessions();

CREATE OR REPLACE FUNCTION public.get_public_sessions()
 RETURNS TABLE(id uuid, shooter_name text, platform text, agent_room text, total_buy_in numeric, stake_available numeric, stake_sold numeric, share_price numeric, end_time timestamp with time zone, status session_status, stream_url text, created_at timestamp with time zone, shooter_tier integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    s.id, s.shooter_name, s.platform, s.agent_room,
    s.total_buy_in, s.stake_available, s.stake_sold, s.share_price,
    s.end_time, s.status, s.stream_url, s.created_at,
    COALESCE(p.seller_tier, 1)::integer as shooter_tier
  FROM public.sessions s
  LEFT JOIN public.profiles p ON p.user_id = s.shooter_id
  ORDER BY s.created_at DESC;
$function$;
