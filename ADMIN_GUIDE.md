# MicroSeed Admin Guide

This guide explains how to access and use the MicroSeed Admin Dashboard.

## Accessing the Admin Panel

To access the admin panel, you must have the `admin` role assigned to your user profile in Firestore.

### Default Admin

The following email is configured as a default admin in `firestore.rules`:
- `favor.charles9@gmail.com`

### Steps to Access:

1. Log in to the application using your Google account.
2. If your email is the one listed above, or if your role has been set to `admin` in the `users` collection, you will see an "Admin Dashboard" option in the user profile dropdown menu (top right).
3. Click on "Admin Dashboard" to enter the administrative interface.

## Admin Dashboard Features

### 1. Overview
- Real-time statistics on total users, businesses, and loans.
- Quick view of pending applications requiring attention.

### 2. Loan Management
- Review pending loan applications.
- Approve or reject loans.
- View loan details, including the AI potential score and fraud check results.

### 3. User Management
- View all registered users.
- Suspend or unsuspend users.
- Change user roles (use with caution).

### 4. Document Review
- Review uploaded financial statements, business permits, and tax certificates.
- Verify the authenticity of documents to move applications forward.

### 5. System Settings
- **Lender Config**: Set minimum interest rates, maximum loan amounts, and required document months.
- **Maintenance Mode**: Toggle maintenance mode to restrict user access during updates.
- **Payment Gateway**: Configure simulated payment settings.

## Security Considerations

- Admin actions are logged in the `audit_logs` collection (viewable in Firestore).
- Only admins can modify global app settings.
- Ensure you log out or close the tab when finished with administrative tasks.
