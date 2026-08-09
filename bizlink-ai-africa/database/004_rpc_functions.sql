-- =========================================================
-- BizLink AI Africa — 004_rpc_functions.sql
-- Fonctions atomiques pour les opérations multi-lignes
-- (un achat ou une vente touche plusieurs tables : l'atomicité
-- ne peut pas être garantie de façon fiable depuis le client JS,
-- donc on l'encapsule ici en PL/pgSQL, appelée via supabase.rpc()).
-- À exécuter après 003_triggers_functions.sql
-- =========================================================

-- ---------------------------------------------------------
-- create_purchase_with_items
-- p_items: [{ "product_id": "uuid", "quantity": number, "unit_cost": number }, ...]
-- ---------------------------------------------------------
create or replace function public.create_purchase_with_items(
  p_organization_id uuid,
  p_supplier_id uuid,
  p_purchase_date date,
  p_notes text,
  p_items jsonb
)
returns purchases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase purchases;
  v_item jsonb;
  v_total numeric(14,2) := 0;
begin
  if current_organization_id() is distinct from p_organization_id then
    raise exception 'Accès refusé : organisation invalide';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Un achat doit contenir au moins un produit';
  end if;

  insert into purchases (organization_id, supplier_id, purchase_date, notes, created_by, total_amount)
  values (p_organization_id, p_supplier_id, p_purchase_date, p_notes, auth.uid(), 0)
  returning * into v_purchase;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into purchase_items (purchase_id, product_id, quantity, unit_cost)
    values (
      v_purchase.id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_cost')::numeric
    );
    v_total := v_total + (v_item->>'quantity')::numeric * (v_item->>'unit_cost')::numeric;
  end loop;

  update purchases set total_amount = v_total where id = v_purchase.id returning * into v_purchase;

  insert into activity_logs (organization_id, user_id, action, entity_type, entity_id)
  values (p_organization_id, auth.uid(), 'create', 'purchase', v_purchase.id);

  return v_purchase;
end;
$$;

-- ---------------------------------------------------------
-- create_sale_with_items
-- p_items: [{ "product_id": "uuid", "quantity": number, "unit_price": number }, ...]
-- p_payment_status: 'paid' | 'partial' | 'unpaid'
-- p_paid_amount: montant réellement payé à la vente (obligatoire si 'partial')
-- Crée automatiquement une dette si la vente n'est pas totalement payée
-- et qu'un client est renseigné.
-- ---------------------------------------------------------
create or replace function public.create_sale_with_items(
  p_organization_id uuid,
  p_customer_id uuid,
  p_sale_date date,
  p_discount numeric,
  p_payment_status sale_payment_status,
  p_payment_method text,
  p_notes text,
  p_items jsonb,
  p_paid_amount numeric default null
)
returns sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales;
  v_item jsonb;
  v_subtotal numeric(14,2) := 0;
  v_profit numeric(14,2) := 0;
  v_unit_cost numeric(14,2);
  v_stock numeric(14,2);
  v_paid numeric(14,2);
  v_remaining numeric(14,2);
begin
  if current_organization_id() is distinct from p_organization_id then
    raise exception 'Accès refusé : organisation invalide';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Une vente doit contenir au moins un produit';
  end if;

  if p_payment_status = 'partial' and (p_customer_id is null or p_paid_amount is null) then
    raise exception 'Une vente partiellement payée nécessite un client et un montant payé';
  end if;

  insert into sales (
    organization_id, customer_id, sale_date, discount, payment_status, payment_method, notes, created_by
  )
  values (
    p_organization_id, p_customer_id, p_sale_date, coalesce(p_discount, 0), p_payment_status,
    p_payment_method, p_notes, auth.uid()
  )
  returning * into v_sale;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select purchase_price, stock_quantity into v_unit_cost, v_stock
    from products
    where id = (v_item->>'product_id')::uuid and organization_id = p_organization_id
    for update;

    if v_stock is null then
      raise exception 'Produit introuvable dans cette organisation';
    end if;

    if v_stock < (v_item->>'quantity')::numeric then
      raise exception 'Stock insuffisant pour ce produit (disponible : %)', v_stock;
    end if;

    insert into sale_items (sale_id, product_id, quantity, unit_price, unit_cost)
    values (
      v_sale.id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      v_unit_cost
    );

    v_subtotal := v_subtotal + (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric;
    v_profit := v_profit + (v_item->>'quantity')::numeric * ((v_item->>'unit_price')::numeric - v_unit_cost);
  end loop;

  update sales
  set subtotal = v_subtotal,
      total_amount = greatest(v_subtotal - coalesce(p_discount, 0), 0),
      profit = v_profit - coalesce(p_discount, 0)
  where id = v_sale.id
  returning * into v_sale;

  if p_payment_status <> 'paid' and p_customer_id is not null then
    v_paid := case
      when p_payment_status = 'unpaid' then 0
      else p_paid_amount
    end;
    v_remaining := greatest(v_sale.total_amount - coalesce(v_paid, 0), 0);

    insert into debts (organization_id, customer_id, sale_id, original_amount, remaining_amount, status)
    values (
      p_organization_id,
      p_customer_id,
      v_sale.id,
      v_sale.total_amount,
      v_remaining,
      case when v_remaining <= 0 then 'paid'::debt_status else 'partial'::debt_status end
    );
  end if;

  insert into notifications (organization_id, type, title, message, metadata)
  values (
    p_organization_id,
    'sale',
    'Nouvelle vente enregistrée',
    format('Une vente de %s a été enregistrée.', v_sale.total_amount),
    jsonb_build_object('sale_id', v_sale.id)
  );

  insert into activity_logs (organization_id, user_id, action, entity_type, entity_id)
  values (p_organization_id, auth.uid(), 'create', 'sale', v_sale.id);

  return v_sale;
end;
$$;

-- Ces fonctions sont SECURITY DEFINER mais re-vérifient current_organization_id()
-- en première ligne : impossible pour un utilisateur d'écrire dans une autre
-- organisation même en appelant le RPC directement.
