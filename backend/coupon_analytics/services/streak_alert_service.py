from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import get_user_model
from coupons.models.coupon import Coupon
from coupon_analytics.models import AlertRule, AlertEvent
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


def get_current_loss_streak(user: User) -> int:
    qs = Coupon.objects.filter(user=user).order_by('-created_at').values_list('status', flat=True)
    streak = 0
    for status in qs:
        if status == Coupon.CouponStatus.CANCELED:
            continue
        if status == Coupon.CouponStatus.LOST:
            streak += 1
            continue
        break
    logger.debug(f"[STREAK] User {user.id}: calculated streak = {streak}")
    return streak


def cleanup_streak_alerts_on_win(user: User) -> None:
    """
    Na wygraną kupon:
    1. Usuń wszystkie stare AlertEvents dla streaku
    2. Stwórz nowy AlertEvent ze metric_value=0 aby zaznaczyć reset
    """
    # Usuń stare alerty
    count = AlertEvent.objects.filter(
        user=user,
        metric='streak_loss'
    ).delete()[0]
    logger.debug(f"[CLEANUP] User {user.id}: deleted {count} streak alerts on WIN (sent + unsent)")

    # Utwórz alert z metric_value=0 dla każdej reguły (reset streaku)
    rules = AlertRule.objects.filter(
        user=user,
        is_active=True,
        metric='streak_loss'
    )

    now = timezone.now()
    for rule in rules:
        try:
            alert = AlertEvent.objects.create(
                rule=rule,
                user=user,
                metric='streak_loss',
                comparator=rule.comparator,
                threshold_value=rule.threshold_value,
                metric_value=Decimal(0),  # ← RESET na 0
                window_start=now,
                window_end=now,
                message_rendered=f"✅ Streaka przerwana - reset (próg: {rule.threshold_value})",
                sent_at=None,  # ← Bot wyśle i ustawi sent_at
            )
            logger.info(f"[CLEANUP] User {user.id}: Created reset alert ID {alert.id} with metric_value=0")
        except Exception as e:
            logger.error(f"[CLEANUP] Error creating reset alert: {e}", exc_info=True)


def check_and_send_streak_loss_alert(user: User) -> None:
    """
    Sprawdzić obecny streak i wysłać alert jeśli >= threshold.
    Alert tworzy się zawsze (metric_value = liczba strat),
    ale send_alert=True tylko gdy >= threshold.
    """
    logger.debug(f"[CHECK_ALERT] Starting for user {user.id}")

    rules = AlertRule.objects.filter(
        user=user,
        is_active=True,
        metric='streak_loss'
    )
    
    logger.debug(f"[CHECK_ALERT] Found {rules.count()} active streak_loss rules for user {user.id}")

    if not rules.exists():
        logger.debug(f"[CHECK_ALERT] No active rules, returning")
        return

    current_streak = get_current_loss_streak(user)
    logger.debug(f"[CHECK_ALERT] Current streak: {current_streak}")

    now = timezone.now()

    for rule in rules:
        logger.debug(f"[CHECK_ALERT] Processing rule {rule.id}: threshold={rule.threshold_value}")

        try:
            threshold = int(rule.threshold_value or 0)
        except (ValueError, TypeError):
            logger.warning(f"[CHECK_ALERT] Invalid threshold for rule {rule.id}")
            continue

        # Szukaj OSTATNIEGO alertu dla tej reguły
        last_alert = AlertEvent.objects.filter(
            rule=rule,
            user=user,
            metric='streak_loss',
        ).order_by('-metric_value').first()

        last_streak = 0
        if last_alert:
            try:
                last_streak = int(last_alert.metric_value or 0)
            except (ValueError, TypeError):
                last_streak = 0
            logger.debug(f"[CHECK_ALERT] Last alert metric_value: {last_streak}, current streak: {current_streak}")

        # Jeśli obecny streak > ostatniego zapisanego, stwórz nowy alert
        if current_streak <= last_streak:
            logger.debug(f"[CHECK_ALERT] Current streak {current_streak} <= last {last_streak}, SKIPPING")
            continue

        logger.debug(f"[CHECK_ALERT] Current streak: {current_streak}, threshold: {threshold}")

        # Zdecyduj czy wysłać alert
        should_send = current_streak >= threshold

        try:
            # Stwórz alert z metric_value = aktualny streak
            alert = AlertEvent.objects.create(
                rule=rule,
                user=user,
                metric='streak_loss',
                comparator=rule.comparator,
                threshold_value=rule.threshold_value,
                metric_value=Decimal(current_streak),  # ← Aktualna liczba strat
                window_start=now,
                window_end=now,
                message_rendered=f"🟥 {current_streak} przegranych z rzędu (próg: {threshold}) 🟥",
                sent_at=None,  # ← Bot wyśle i ustawi sent_at
            )

            if should_send:
                logger.info(f"[CHECK_ALERT] Created AlertEvent ID {alert.id} (pending send) with metric_value={alert.metric_value} (streak increased {last_streak} → {current_streak})")
            else:
                logger.debug(f"[CHECK_ALERT] Created AlertEvent ID {alert.id} (stored, streak {current_streak} < threshold {threshold})")

        except Exception as e:
            logger.error(f"[CHECK_ALERT] Error creating AlertEvent: {e}", exc_info=True)


