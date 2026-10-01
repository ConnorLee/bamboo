-- Read-only, last 30 days of observed browser sessions (not unique people).
-- Respect missing telemetry: opt-outs, blocked requests and different browsers
-- cannot be treated as complete attribution. Only the webhook emits completion.
WITH cohort AS (
  SELECT visitor_id, min(created_at) AS first_view
  FROM halo_reservation_events
  WHERE event = 'landing_view' AND visitor_id IS NOT NULL
    AND created_at >= now() - interval '30 days'
  GROUP BY visitor_id
), stages AS (
  SELECT c.visitor_id,
    bool_or(e.event = 'reserve_click') AS clicked,
    bool_or(e.event = 'checkout_started') AS started,
    bool_or(e.event = 'reservation_completed' AND e.source = 'stripe') AS paid
  FROM cohort c
  JOIN halo_reservation_events e ON e.visitor_id = c.visitor_id AND e.created_at >= c.first_view
  GROUP BY c.visitor_id
), counts AS (
  SELECT count(*) AS measured_sessions,
    count(*) FILTER (WHERE clicked) AS reserve_clicks,
    count(*) FILTER (WHERE clicked AND started) AS checkouts,
    count(*) FILTER (WHERE clicked AND started AND paid) AS paid_reservations
  FROM stages
)
SELECT *,
  round(100.0 * reserve_clicks / nullif(measured_sessions, 0), 2) AS view_to_click_percent,
  round(100.0 * checkouts / nullif(reserve_clicks, 0), 2) AS click_to_checkout_percent,
  round(100.0 * paid_reservations / nullif(checkouts, 0), 2) AS checkout_to_paid_percent
FROM counts;

-- Reconcile economics independently of incomplete browser attribution.
-- Deposits remain refund liabilities and are not additional retail revenue.
SELECT
  count(*) FILTER (WHERE payment_status = 'paid') AS ever_paid,
  count(*) FILTER (WHERE payment_status = 'paid' AND refund_status = 'refunded') AS fully_refunded,
  count(*) FILTER (WHERE refund_status = 'pending') AS pending_refund_review,
  count(*) FILTER (WHERE refund_status = 'failed') AS failed_refund_review,
  coalesce(sum(amount - refunded_amount) FILTER (WHERE payment_status = 'paid'), 0) AS net_deposits_cents
FROM halo_reservations;
