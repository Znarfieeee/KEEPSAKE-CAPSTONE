"""
Utility script to clean up orphaned Supabase Auth users
that don't have corresponding records in the users table.

This can happen if the auth user creation succeeds but
the database insert fails for some reason.

Usage:
    python -m utils.cleanup_orphaned_users

This script should be run with caution and only when needed.
"""

from config.settings import supabase_service_role_client
from dotenv import load_dotenv

load_dotenv()

def cleanup_orphaned_auth_users(dry_run=True):
    """
    Find and optionally delete auth users that don't have
    corresponding records in the users table.

    Args:
        dry_run (bool): If True, only report orphaned users without deleting
    """
    try:
        # Get service role client
        service_client = supabase_service_role_client()

        print("🔍 Scanning for orphaned auth users...")
        print(f"Mode: {'DRY RUN (no changes will be made)' if dry_run else 'LIVE (will delete orphaned users)'}")
        print("-" * 60)

        # Get all auth users
        auth_response = service_client.auth.admin.list_users()
        auth_users = auth_response if isinstance(auth_response, list) else []

        print(f"📊 Found {len(auth_users)} auth users")

        # Get all user_ids from users table
        db_response = service_client.table('users').select('user_id, email').execute()
        db_user_ids = {user['user_id'] for user in db_response.data} if db_response.data else set()

        print(f"📊 Found {len(db_user_ids)} users in database")
        print("-" * 60)

        # Find orphaned users
        orphaned_users = []
        for auth_user in auth_users:
            if hasattr(auth_user, 'id') and auth_user.id not in db_user_ids:
                orphaned_users.append(auth_user)

        if not orphaned_users:
            print("✅ No orphaned auth users found!")
            return 0

        print(f"⚠️  Found {len(orphaned_users)} orphaned auth users:")
        print("-" * 60)

        for i, user in enumerate(orphaned_users, 1):
            email = getattr(user, 'email', 'N/A')
            user_id = getattr(user, 'id', 'N/A')
            created_at = getattr(user, 'created_at', 'N/A')

            print(f"{i}. Email: {email}")
            print(f"   ID: {user_id}")
            print(f"   Created: {created_at}")
            print()

        if not dry_run:
            confirm = input(f"\n⚠️  Are you sure you want to DELETE {len(orphaned_users)} orphaned auth users? (yes/no): ")
            if confirm.lower() != 'yes':
                print("❌ Cancelled by user")
                return 0

            print("\n🗑️  Deleting orphaned auth users...")
            deleted_count = 0
            failed_count = 0

            for user in orphaned_users:
                try:
                    service_client.auth.admin.delete_user(user.id)
                    print(f"✅ Deleted: {getattr(user, 'email', user.id)}")
                    deleted_count += 1
                except Exception as e:
                    print(f"❌ Failed to delete {getattr(user, 'email', user.id)}: {str(e)}")
                    failed_count += 1

            print("-" * 60)
            print(f"✅ Successfully deleted: {deleted_count}")
            print(f"❌ Failed to delete: {failed_count}")

            return deleted_count
        else:
            print("\n💡 To actually delete these orphaned users, run:")
            print("   python -m utils.cleanup_orphaned_users --live")

            return len(orphaned_users)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return -1


if __name__ == "__main__":
    import sys

    # Check for --live flag
    dry_run = '--live' not in sys.argv

    if not dry_run:
        print("⚠️  WARNING: Running in LIVE mode - orphaned users will be DELETED!")
        print()

    count = cleanup_orphaned_auth_users(dry_run=dry_run)

    if count >= 0:
        print("\n" + "=" * 60)
        print(f"✅ Cleanup completed. {'Found' if dry_run else 'Deleted'}: {count} orphaned users")
        print("=" * 60)
    else:
        print("\n❌ Cleanup failed")
        sys.exit(1)
