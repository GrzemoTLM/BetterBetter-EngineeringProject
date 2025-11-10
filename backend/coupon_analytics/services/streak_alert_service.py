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

    count = AlertEvent.objects.filter(
        user=user,
        metric='streak_loss'
    ).delete()[0]
    logger.debug(f"[CLEANUP] User {user.id}: deleted {count} streak alerts on WIN (sent + unsent)")


def check_and_send_streak_loss_alert(user: User) -> None:
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

    for rule in rules:
        logger.debug(f"[CHECK_ALERT] Processing rule {rule.id}: threshold={rule.threshold_value}")

        try:
            threshold = int(rule.threshold_value or 0)
        except (ValueError, TypeError):
            logger.warning(f"[CHECK_ALERT] Invalid threshold for rule {rule.id}")
            continue

        if current_streak >= threshold:
            logger.debug(f"[CHECK_ALERT] Streak {current_streak} >= threshold {threshold}, checking for duplicates...")
            now = timezone.now()

            last_alert = AlertEvent.objects.filter(
                rule=rule,
                user=user,
                metric='streak_loss'
            ).order_by('-metric_value').first()

            if last_alert:
                try:
                    last_streak = int(last_alert.metric_value or 0)
                except (ValueError, TypeError):
                    last_streak = 0

                logger.debug(f"[CHECK_ALERT] Found last alert with streak={last_streak}, sent_at={last_alert.sent_at}")

                if current_streak <= last_streak:
                    logger.debug(f"[CHECK_ALERT] Streak {current_streak} <= last_streak {last_streak}, SKIPPING (no duplicate)")
                    continue
                else:
                    logger.debug(f"[CHECK_ALERT] Streak {current_streak} > last_streak {last_streak}, will create NEW alert")
            else:
                logger.debug(f"[CHECK_ALERT] No alert found, will create new one")

            try:
                alert = AlertEvent.objects.create(
                    rule=rule,
                    user=user,
                    metric='streak_loss',
                    comparator=rule.comparator,
                    threshold_value=rule.threshold_value,
                    metric_value=Decimal(current_streak),
                    window_start=now,
                    window_end=now,
                    message_rendered=f"🟥 {current_streak} przegranych z rzędu (próg: {threshold}) 🟥",
                    sent_at=None,
                )
                logger.info(f"[CHECK_ALERT] Created AlertEvent ID {alert.id} with metric_value={alert.metric_value}")
            except Exception as e:
                logger.error(f"[CHECK_ALERT] Error creating AlertEvent: {e}", exc_info=True)


