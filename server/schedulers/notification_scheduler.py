"""
Notification Scheduler - KEEPSAKE Healthcare System
Runs periodic checks for appointment reminders, vaccination dues, and cleanup
"""

import schedule
import time
from datetime import datetime
import logging
from utils.notification_utils import (
    check_and_create_appointment_reminders,
    check_and_create_vaccination_reminders,
    cleanup_expired_notifications
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def check_appointment_reminders():
    """Check and create appointment reminders"""
    try:
        logger.info("Checking for upcoming appointments...")
        notifications = check_and_create_appointment_reminders(hours_ahead=24)
        logger.info(f"Created {len(notifications)} appointment reminder notifications")
    except Exception as e:
        logger.error(f"Error checking appointment reminders: {e}")


def check_vaccination_reminders():
    """Check and create vaccination due reminders"""
    try:
        logger.info("Checking for upcoming vaccinations...")
        notifications = check_and_create_vaccination_reminders(days_ahead=7)
        logger.info(f"Created {len(notifications)} vaccination reminder notifications")
    except Exception as e:
        logger.error(f"Error checking vaccination reminders: {e}")


def cleanup_notifications():
    """Clean up expired and old archived notifications"""
    try:
        logger.info("Cleaning up expired notifications...")
        result = cleanup_expired_notifications()
        if result:
            logger.info("Successfully cleaned up expired notifications")
        else:
            logger.warning("Failed to clean up notifications")
    except Exception as e:
        logger.error(f"Error cleaning up notifications: {e}")


def run_scheduler():
    """Run the notification scheduler"""
    logger.info("Starting notification scheduler...")

    # Schedule appointment reminders check every hour
    schedule.every(1).hours.do(check_appointment_reminders)

    # Schedule vaccination reminders check every 6 hours
    schedule.every(6).hours.do(check_vaccination_reminders)

    # Schedule cleanup daily at 2 AM
    schedule.every().day.at("02:00").do(cleanup_notifications)

    # Run checks immediately on startup
    check_appointment_reminders()
    check_vaccination_reminders()

    logger.info("Notification scheduler started successfully")
    logger.info("Next appointment check: in 1 hour")
    logger.info("Next vaccination check: in 6 hours")
    logger.info("Next cleanup: daily at 2:00 AM")

    # Keep the scheduler running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == "__main__":
    try:
        run_scheduler()
    except KeyboardInterrupt:
        logger.info("Notification scheduler stopped by user")
    except Exception as e:
        logger.error(f"Notification scheduler error: {e}")
