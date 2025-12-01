-- Active: 1732958105742@@127.0.0.1@5432@postgres
-- 1. PROFILES (Extends auth.users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  full_name text,
  avatar_url text,
  wallet_address text, -- Placeholder for future Cardano wallet
  reputation_score int default 0,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 2. PRODUCTS
create table products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references profiles(id) not null,
  title text not null,
  description text not null,
  price_ada numeric not null, -- Display price in ADA (simulated)
  price_fiat numeric, -- Optional functionality
  category text,
  image_url text,
  status text default 'available', -- available, sold, suspended
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table products enable row level security;

-- Policies for Products
create policy "Products are viewable by everyone." on products
  for select using (true);

create policy "Users can create products." on products
  for insert with check (auth.uid() = seller_id);

create policy "Sellers can update their own products." on products
  for update using (auth.uid() = seller_id);

-- 3. ORDERS (The core of the Web2 Escrow)
create table orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references profiles(id) not null,
  seller_id uuid references profiles(id) not null,
  product_id uuid references products(id) not null,
  amount_ada numeric not null,
  status text default 'pending', 
  -- STATUS FLOW: 
  -- 'pending' (created) 
  -- 'escrow_web2' (buyer "paid" -> fake escrow) 
  -- 'shipped' (seller sent item)
  -- 'completed' (buyer received -> funds released)
  -- 'disputed' (issue reported)
  escrow_hash text, -- Placeholder for database-side simulated hash
  -- Négociation de prix (Web2 MVP)
  order_mode text default 'direct', -- 'direct' ou 'negotiation'
  proposed_price numeric, -- Montant proposé et bloqué par l'acheteur
  final_price numeric, -- Prix final accepté par les deux parties
  escrow_status text, -- 'open' | 'cancelled' | 'released' (pour le mode négociation)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table orders enable row level security;

create policy "Users can see their own orders (buyer or seller)." on orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Authenticated users can create orders." on orders
  for insert with check (auth.uid() = buyer_id);

create policy "Participants can update order status." on orders
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- 4. MESSAGES (Transactional Chat)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) not null,
  sender_id uuid references profiles(id) not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table messages enable row level security;

create policy "Users can see messages for their orders." on messages
  for select using (
    exists (
      select 1 from orders 
      where orders.id = messages.order_id 
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
  );

create policy "Users can send messages to their orders." on messages
  for insert with check (
    exists (
      select 1 from orders 
      where orders.id = messages.order_id 
      and (orders.buyer_id = auth.uid() or orders.seller_id = auth.uid())
    )
  );

-- 5. RATINGS
create table ratings (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) not null,
  rater_id uuid references profiles(id) not null, -- Who gives the rating
  rated_id uuid references profiles(id) not null, -- Who receives the rating
  stars int check (stars >= 1 and stars <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table ratings enable row level security;
create policy "Ratings are public." on ratings for select using (true);
create policy "Participants can rate completed orders." on ratings for insert with check (auth.uid() = rater_id);

-- 6. WZP TRANSACTIONS (Simulated Rewards)
create table wzp_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  amount numeric not null,
  type text not null, -- 'earn_buy', 'earn_sell', 'referral'
  reference_id uuid, -- Link to order_id if applicable
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table wzp_transactions enable row level security;
create policy "Users can see own WZP history." on wzp_transactions
  for select using (auth.uid() = user_id);

-- TRIGGER: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


