-- RPC function for in-app account deletion (called from iOS client)
-- Uses SECURITY DEFINER so it can delete from auth.users on behalf of the caller
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_family_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Find the user's family
    SELECT id INTO v_family_id FROM public.families WHERE user_id = v_user_id;

    IF v_family_id IS NOT NULL THEN
        DELETE FROM public.shopping_list_items WHERE family_id = v_family_id;
        DELETE FROM public.inventory_items WHERE family_id = v_family_id;
        DELETE FROM public.family_members WHERE family_id = v_family_id;
        DELETE FROM public.families WHERE id = v_family_id;
    END IF;

    -- Delete the auth user (SECURITY DEFINER allows this)
    DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_user_account() FROM anon;
