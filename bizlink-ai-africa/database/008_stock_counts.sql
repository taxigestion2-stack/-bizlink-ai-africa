-- =========================================================
-- BizLink AI Africa — 008_stock_counts.sql
-- Comptage physique de stock (pertes / écarts d'inventaire)
-- À exécuter après 007_staff_invites.sql
-- =========================================================

-- ---------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------
create table stock_counts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  notes text,
  total_loss_value numeric(14,2) not null default 0,
  created_by uuid references profiles(id) on delete set null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table stock_count_items (
  id uuid primary key default gen_random_uuid(),
  stock_count_id uuid not null references stock_counts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null, -- copie du nom au moment du comptage (historique fiable même si le produit est renommé/supprimé plus tard)
  system_quantity numeric(14,2) not null,   -- ce que dit l'application avant le comptage
  counted_quantity numeric(14,2) not null,  -- ce que le commerçant a compté physiquement
  unit_cost numeric(14,2) not null default 0, -- prix d'achat au moment du comptage (fige la valeur de la perte)
  difference numeric(14,2) generated always as (counted_quantity - system_quantity) stored
);

create index idx_stock_counts_organization on stock_counts(organization_id, completed_at);
create index idx_stock_count_items_count on stock_count_items(stock_count_id);

-- ---------------------------------------------------------
-- RLS
-- ---------------------------------------------------------
alter table stock_counts enable row level security;
alter table stock_count_items enable row level security;

create policy "stock_counts_select_same_org" on stock_counts for select
  using (organization_id = current_organization_id());

create policy "stock_count_items_select_same_org" on stock_count_items for select
  using (
    stock_count_id in (select id from stock_counts where organization_id = current_organization_id())
  );

-- L'écriture passe exclusivement par la fonction RPC ci-dessous (SECURITY DEFINER),
-- jamais par un insert direct du client : pas de policy insert/update pour les utilisateurs.

-- ---------------------------------------------------------
-- RPC : perform_stock_count
-- Enregistre un comptage physique en une seule opération atomique :
-- ajuste le stock de chaque produit compté pour qu'il corresponde à la
-- réalité physique, et calcule la valeur totale des pertes constatées.
-- p_items: [{ "product_id": "uuid", "counted_quantity": number }, ...]
-- ---------------------------------------------------------
create or replace function public.perform_stock_count(
  p_organization_id uuid,
  p_items jsonb,
  p_notes text default null
)
returns stock_counts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_count stock_counts;
  v_item jsonb;
  v_product_id uuid;
  v_counted numeric(14,2);
  v_system_qty numeric(14,2);
  v_unit_cost numeric(14,2);
  v_product_name text;
  v_total_loss numeric(14,2) := 0;
begin
  if current_organization_id() is distinct from p_organization_id then
    raise exception 'Accès refusé : organisation invalide';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Un comptage doit contenir au moins un produit';
  end if;

  insert into stock_counts (organization_id, notes, created_by)
  values (p_organization_id, p_notes, auth.uid())
  returning * into v_stock_count;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_counted := (v_item->>'counted_quantity')::numeric;

    select stock_quantity, purchase_price, name
    into v_system_qty, v_unit_cost, v_product_name
    from products
    where id = v_product_id and organization_id = p_organization_id
    for update;

    if v_system_qty is null then
      raise exception 'Produit introuvable dans cette organisation';
    end if;

    insert into stock_count_items (
      stock_count_id, product_id, product_name, system_quantity, counted_quantity, unit_cost
    )
    values (v_stock_count.id, v_product_id, v_product_name, v_system_qty, v_counted, v_unit_cost);

    if v_counted < v_system_qty then
      v_total_loss := v_total_loss + (v_system_qty - v_counted) * v_unit_cost;
    end if;

    -- Ajuste le stock pour qu'il corresponde à la réalité physique constatée
    update products set stock_quantity = v_counted where id = v_product_id;
  end loop;

  update stock_counts set total_loss_value = v_total_loss where id = v_stock_count.id
  returning * into v_stock_count;

  insert into activity_logs (organization_id, user_id, action, entity_type, entity_id)
  values (p_organization_id, auth.uid(), 'create', 'stock_count', v_stock_count.id);

  if v_total_loss > 0 then
    insert into notifications (organization_id, type, title, message, metadata)
    values (
      p_organization_id,
      'stock_low',
      'Pertes constatées lors du comptage',
      format('Le comptage physique révèle des pertes estimées à %s.', v_total_loss),
      jsonb_build_object('stock_count_id', v_stock_count.id)
    );
  end if;

  return v_stock_count;
end;
$$;
