# MindConnect Admin Console Push Notifications Guide

## Overview

The Admin Console provides full operational visibility over the MindConnect push notification subsystem, device registrations, system metrics, and targeted broadcast campaigns.

---

## 1. Accessing the Push Console

1. Log into the MindConnect Admin Portal with administrator credentials.
2. In the sidebar menu, navigate to **Communications -> Push Notifications**.

---

## 2. Reading System Health Metrics

The metrics panel at the top of the console displays real-time health:

- **Active Push Devices:** Count of unique, active, enabled mobile devices registered across students, peer listeners, and counsellors.
- **Outbox Pending Queue:** Jobs currently waiting in MongoDB outbox for worker execution.
- **Delivery Provider:** Displays `READY` if `EXPO_PUSH_ACCESS_TOKEN` is configured on the backend, or `UNCONFIGURED` if manual action is needed.
- **Failures (Last Hour):** Number of delivery failures in the past 60 minutes.
- **Invalid Tokens Pruned:** Devices automatically disabled due to app uninstallation or token expiration.

---

## 3. Creating & Broadcasting Campaigns

### Step 1: Compose Draft
Fill out the **Broadcast Campaign Composer**:
- **Campaign Name:** Internal descriptive name (e.g., "Exam Week Mindfulness Campaign").
- **Title:** Lock screen header (Keep under 60 characters for best display).
- **Body:** Clear, encouraging message (Max 180 characters).
- **Category:** Select `Content & Wellbeing`, `Optional Reminders`, or `System`.
- **Target Route:** Destination screen when tapped (`Home`, `Inbox`, `Content Library`, etc.).
- **Schedule:** Optional future date/time or leave empty for immediate execution.
- **Target Roles:** Select checkboxes for `Students`, `Peer Listeners`, or `Counsellors`.
- Click **Create Campaign Draft**.

### Step 2: Preview & Verify
- Click **Preview** on the campaign row.
- Review audience size, estimated opted-out user count, and reachable device estimate.

### Step 3: Confirm & Broadcast
- Click **Confirm** on the campaign row.
- Confirm the confirmation popup. The campaign status moves to `scheduled` / `sending` and the worker queues outbox items for all matching users.
