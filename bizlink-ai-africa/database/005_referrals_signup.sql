-- =========================================================
-- BizLink AI Africa — 005_referrals_signup.sql
-- Capture du code de parrainage à l'inscription
-- À exécuter après 004_rpc_functions.sql
-- =========================================================

-- Remplace handle_new_user (003_triggers_functions.sql) pour ajouter la
-- création d'une ligne `referrals` si l'utilisateur s'est inscrit via un
-- lien de parrainage (raw_user_meta_data->>'referral_code').
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_referral_code text;
  v_referral_code_id uuid;
  v_referrer_org_id uuid;
begin
  v_org_name := coalesce(new.raw_user_meta_data->>'organization_name', 'Ma boutique');

  insert into organizations (name, slug, plan)
  values (
    v_org_name,
    lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8),
    'free'
  )
  returning id into v_org_id;

  insert into profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'admin'
  );

  update organizations set owner_id = new.id where id = v_org_id;

  insert into subscriptions (organization_id, plan, status, current_period_start)
  values (v_org_id, 'free', 'active', now());

  -- Génère automatiquement le propre code de parrainage de la nouvelle organisation
  insert into referral_codes (organization_id, code)
  values (v_org_id, upper(substr(replace(v_org_id::text, '-', ''), 1, 8)));

  -- Si un code de parrainage a été utilisé pour s'inscrire, on enregistre le lien
  v_referral_code := new.raw_user_meta_data->>'referral_code';
  if v_referral_code is not null then
    select id, organization_id into v_referral_code_id, v_referrer_org_id
    from referral_codes
    where code = v_referral_code;

    if v_referral_code_id is not null and v_referrer_org_id <> v_org_id then
      insert into referrals (referral_code_id, referrer_organization_id, referred_organization_id, status)
      values (v_referral_code_id, v_referrer_org_id, v_org_id, 'pending');

      insert into notifications (organization_id, type, title, message, metadata)
      values (
        v_referrer_org_id,
        'referral_reward',
        'Nouveau filleul inscrit',
        'Un commerce s''est inscrit grâce à votre lien de parrainage.',
        jsonb_build_object('referred_organization_id', v_org_id)
      );
    end if;
  end if;

  return new;
end;
$$;
