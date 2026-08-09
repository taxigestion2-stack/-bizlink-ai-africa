-- =========================================================
-- BizLink AI Africa — 007_staff_invites.sql
-- Invitation d'employés (staff) dans une organisation existante
-- À exécuter après 006_affiliate_attribution.sql
-- =========================================================

-- ---------------------------------------------------------
-- Version finale de handle_new_user : gère en plus le cas d'un utilisateur
-- INVITÉ dans une organisation existante (par un admin), au lieu de créer
-- systématiquement une nouvelle organisation. Détecté via
-- raw_user_meta_data->>'invited_organization_id' (posé par supabase.auth.admin.inviteUserByEmail).
-- ---------------------------------------------------------
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
  v_affiliate_code text;
  v_affiliate_account_id uuid;
  v_invited_org_id uuid;
  v_invited_role user_role;
begin
  -- ---------------------------------------------------------
  -- Cas 1 : utilisateur invité par un admin dans une organisation existante
  -- ---------------------------------------------------------
  v_invited_org_id := (new.raw_user_meta_data->>'invited_organization_id')::uuid;

  if v_invited_org_id is not null then
    v_invited_role := coalesce(new.raw_user_meta_data->>'invited_role', 'staff')::user_role;

    insert into profiles (id, organization_id, full_name, email, role, is_active)
    values (
      new.id,
      v_invited_org_id,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      new.email,
      v_invited_role,
      true
    );

    insert into notifications (organization_id, type, title, message, metadata)
    values (
      v_invited_org_id,
      'system',
      'Nouveau membre',
      format('%s a rejoint votre équipe.', coalesce(new.raw_user_meta_data->>'full_name', new.email)),
      jsonb_build_object('user_id', new.id)
    );

    return new;
  end if;

  -- ---------------------------------------------------------
  -- Cas 2 (comportement existant) : inscription classique, création d'une
  -- nouvelle organisation
  -- ---------------------------------------------------------
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

  insert into referral_codes (organization_id, code)
  values (v_org_id, upper(substr(replace(v_org_id::text, '-', ''), 1, 8)));

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

  v_affiliate_code := new.raw_user_meta_data->>'affiliate_code';
  if v_affiliate_code is not null then
    select id into v_affiliate_account_id
    from affiliate_accounts
    where affiliate_code = v_affiliate_code and status = 'approved';

    if v_affiliate_account_id is not null then
      update organizations set referred_by_affiliate_id = v_affiliate_account_id where id = v_org_id;

      update affiliate_accounts
      set total_conversions = total_conversions + 1
      where id = v_affiliate_account_id;
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------
-- RLS : un admin peut mettre à jour les profils des membres de sa propre
-- organisation (changer de rôle, activer/désactiver) — en plus de la policy
-- existante "profiles_update_self" qui ne couvre que son propre profil.
-- ---------------------------------------------------------
create policy "profiles_update_by_admin" on profiles for update
  using (
    organization_id = current_organization_id()
    and current_user_role() = 'admin'
  );
