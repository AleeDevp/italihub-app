# Audit Logging Guide

This document defines the enums for **AuditEntityType** and **AuditAction** and explains their intended usage.  
Always log **who did what, to which entity, with what outcome**.

---

## AuditEntityType

- **AD** — generic ad (fallback when category not needed)
- **AD_HOUSING** — housing ad
- **AD_TRANSPORTATION** — transportation ad
- **AD_MARKETPLACE** — marketplace ad
- **AD_SERVICE** — service ad
- **AD_EXCHANGE** — exchange ad
- **USER** — user account
- **MODERATION_ACTION** — moderator decision record
- **VERIFICATION_REQUEST** — identity/verification request
- **VERIFICATION_FILE** — uploaded verification document
- **AD_REPORT** — user-submitted report
- **REPORT_FILE** — evidence file in a report
- **ANNOUNCEMENT** — global announcement
- **NOTIFICATION** — user-specific notification
- **POSTING_POLICY** — policy definition (admin-managed)
- **POLICY_ACCEPTANCE** — user acceptance of policy
- **MEDIA_ASSET** — uploaded image/video asset
- **CITY** — city entity in system
- **OTHER** — fallback for uncategorized entities

---

## AuditAction

### Auth & Account

- **REGISTER** — user registration
- **LOGIN** — user login
- **LOGOUT** — user logout
- **PASSWORD_RESET_REQUEST** — start reset flow
- **PASSWORD_RESET_CONFIRM** — complete reset flow
- **PASSWORD_CHANGE** — change password in session
- **EMAIL_CHANGE_REQUEST** — request email change
- **EMAIL_CHANGE_CONFIRM** — confirm email change
- **OAUTH_LINK_GOOGLE** — link Google account
- **OAUTH_UNLINK_GOOGLE** — unlink Google account
- **OAUTH_LINK_FACEBOOK** — link Facebook account
- **OAUTH_UNLINK_FACEBOOK** — unlink Facebook account
- **SESSION_REVOKE_ALL** — revoke all sessions
- **ACCOUNT_DELETE_REQUEST** — request account deletion
- **ACCOUNT_DELETE** — permanent account deletion

### Profile

- **PROFILE_COMPLETE** — complete complete-profile section
- **PROFILE_EDIT** — update profile fields (legacy - use specific field actions below)
- **PROFILE_NAME_EDIT** — update user's display name
- **PROFILE_USERID_EDIT** — update user's ItaliaHub ID
- **PROFILE_TELEGRAMID_EDIT** — update user's Telegram handle
- **PROFILE_PHOTO_CHANGE** — change profile photo
- **PROFILE_PHOTO_DELETE** — remove profile photo
- **CITY_CHANGE** — change selected city
- **ROLE_ASSIGN** — admin grants role
- **ROLE_REVOKE** — admin revokes role

### Verification

- **VERIFICATION_SUBMIT** — submit verification request
- **VERIFICATION_FILE_UPLOAD** — upload verification file
- **VERIFICATION_FILE_DELETE** — delete verification file
- **VERIFICATION_APPROVE** — moderator approves request
- **VERIFICATION_REJECT** — moderator rejects request
- **VERIFICATION_REVOKE** — revoke verification status
- **VERIFICATION_ACCESS** — moderator/system views docs

### Ads (owner actions)

- **AD_CREATE** — create new ad
- **AD_EDIT** — edit ad content
- **AD_RENEW** — renew ad (housing/transport)
- **AD_DELETE** — delete ad
- **AD_SUBMIT_FOR_REVIEW** — submit to review (status pending)
- **AD_MEDIA_UPLOAD** — upload ad image/video
- **AD_MEDIA_DELETE** — delete ad image/video
- **AD_MEDIA_REORDER** — change order of media
- **AD_COVER_SET** — set cover photo
- **AD_CONTACT_REVEAL** — reveal owner contact

### Ads (moderation/status)

- **AD_APPROVE** — moderator approves ad
- **AD_REJECT** — moderator rejects ad
- **AD_EXPIRE** — ad auto/manual expiration
- **AD_RESTORE** — restore expired/rejected ad
- **AD_STATUS_SET** — direct status change

### Reports

- **REPORT_SUBMIT** — user submits report
- **REPORT_FILE_UPLOAD** — upload file to report
- **REPORT_FILE_DELETE** — delete report file
- **REPORT_FLAG** — flag content in report
- **REPORT_UNFLAG** — unflag content in report
- **REPORT_CLOSE** — close report with outcome
- **REPORT_DISMISS** — dismiss report

### Notifications & Announcements

- **NOTIFICATION_CREATE** — send notification
- **NOTIFICATION_MARK_READ** — mark one read
- **NOTIFICATION_MARK_ALL_READ** — mark all read
- **ANNOUNCEMENT_CREATE** — create announcement
- **ANNOUNCEMENT_UPDATE** — update announcement
- **ANNOUNCEMENT_DELETE** — delete announcement
- **ANNOUNCEMENT_PIN** — pin announcement
- **ANNOUNCEMENT_UNPIN** — unpin announcement
- **ANNOUNCEMENT_DISMISS** — user dismisses announcement

### Policies

- **POLICY_CREATE** — create new policy
- **POLICY_UPDATE** — update policy
- **POLICY_RETIRE** — retire policy
- **POLICY_ACCEPT** — user accepts policy

### Cities

- **CITY_CREATE** — add city
- **CITY_UPDATE** — update city
- **CITY_ENABLE** — enable city
- **CITY_DISABLE** — disable city
- **CITY_SORT_UPDATE** — change city sort order

### Email & Support

- **EMAIL_SEND** — system sends email
- **SUPPORT_MESSAGE_SEND** — user sends support message

### System

- **SCHEDULER_EXPIRE_ADS** — auto-expire ads by job
- **METRICS_ROLLUP** — daily counters aggregation
- **CLEANUP_ORPHAN_MEDIA** — clean orphaned media
- **MIGRATION_RUN** — run migration
- **BATCH_CLEANUP** — batch cleanup job
