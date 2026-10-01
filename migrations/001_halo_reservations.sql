BEGIN;

CREATE TABLE IF NOT EXISTS halo_reservations (
  id uuid PRIMARY KEY,
  attempt_id uuid NOT NULL UNIQUE,
  session_hash text NOT NULL UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  stripe_customer_id text,
  amount integer NOT NULL DEFAULT 2500 CHECK (amount = 2500),
  currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','processing','paid','failed','cancelled')),
  refund_status text NOT NULL DEFAULT 'none' CHECK (refund_status IN ('none','pending','refunded','partial','failed')),
  refund_request_id uuid UNIQUE,
  stripe_refund_id text,
  refunded_amount integer NOT NULL DEFAULT 0 CHECK (refunded_amount BETWEEN 0 AND 2500),
  email text,
  receipt_url text,
  wrist_size text,
  shipping_country char(2),
  marketing_consent boolean NOT NULL DEFAULT false,
  marketing_consent_at timestamptz,
  visitor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- A ledger insert and its reservation update commit in the SAME transaction.
CREATE TABLE IF NOT EXISTS halo_stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  reservation_id uuid REFERENCES halo_reservations(id),
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS halo_rate_limits (
  key text NOT NULL,
  bucket bigint NOT NULL,
  count integer NOT NULL,
  PRIMARY KEY (key, bucket)
);

-- Allowlisted first-party funnel events only; no raw request bodies or payment data.
CREATE TABLE IF NOT EXISTS halo_reservation_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event text NOT NULL,
  source text NOT NULL,
  visitor_id uuid,
  attempt_id uuid,
  reservation_id uuid REFERENCES halo_reservations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS halo_reservation_events_date_idx ON halo_reservation_events(created_at);
CREATE INDEX IF NOT EXISTS halo_reservation_events_visitor_idx ON halo_reservation_events(visitor_id, event);
COMMIT;
