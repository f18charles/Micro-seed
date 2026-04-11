# Admin Panel Guide

This guide explains how to access and use the MicroSeed Administrative Dashboard.

## Accessing the Admin Panel

The Admin Panel is restricted to users with the `admin` role.

1. **Login**: Sign in using your Google account.
2. **Check Role**: Ensure your user document in the `users` collection has `"role": "admin"`.
3. **Navigation**: 
   - Click on your profile avatar in the top-right corner.
   - Select **"Admin Panel"** from the dropdown menu.
   - If you do not see this link, your account does not have administrative privileges.

## Dashboard Modules

### 1. Overview
The landing page for admins. It provides:
- **Real-time KPIs**: Total Users, Active Businesses, Pending Loans, and Total Disbursed.
- **Recent Activity**: A live feed of administrative actions and system events.
- **Alerts**: Notifications for loans that have been pending for more than 48 hours.

### 2. Loan Management
Manage the lifecycle of loan applications:
- **Pipeline View**: A Kanban-style board to track loans through different statuses.
- **Table View**: A detailed list with search, filtering, and CSV export capabilities.
- **Loan Actions**: Click on a loan to open the detail drawer where you can:
  - Approve or Reject applications.
  - Mark loans as Disbursed.
  - Flag loans for Risk (Low, Medium, High).
  - Add internal notes.

### 3. User Management
Oversight of the platform's user base:
- **User List**: Search and filter users by name or email.
- **User Actions**:
  - **Suspend/Reinstate**: Block users from accessing core features.
  - **Promote to Admin**: Grant administrative privileges to other users.
  - **View History**: See a user's businesses and loan history.

### 4. Analytics
Visual data representation using Recharts:
- **Loan Distribution**: Status breakdown of all applications.
- **Industry Analysis**: Which sectors are most active.
- **Disbursement Trends**: Monthly volume of capital provided.

### 5. Repayment Monitoring
Track the financial health of active loans:
- **Repayment List**: Monitor upcoming and overdue payments.
- **Repayment Calendar**: A visual view of when payments are expected.

### 6. Settings
Configure platform-wide parameters:
- **Maintenance Mode**: Toggle the platform into maintenance mode. Users will see a custom message and be blocked from most actions.
- **Financial Defaults**: Set the default interest rate for new assessments.

## Audit Logging
Every administrative action (approvals, rejections, suspensions, settings changes) is automatically recorded in the `audit_logs` collection. This ensures transparency and accountability within the administrative team.

## Security Note
Administrative access is enforced at two levels:
1. **Frontend**: The `checkAuthGuard` utility prevents unauthorized navigation.
2. **Backend**: Firestore Security Rules (`firestore.rules`) strictly validate that only users with the `admin` role can write to sensitive collections or modify other users' data.
