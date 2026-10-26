# Office Approval API

All endpoints are served by Next.js Route Handlers under `/api`. Successful responses use `{ "data": ... }`; errors use `{ "error": { "code", "message", "details?" } }`. Mutating requests require the browser's same-origin `Origin` header and an authenticated session unless the endpoint is login or logout.

## Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Login with `{ "username", "password" }`; sets an HttpOnly session cookie |
| POST | `/api/auth/logout` | Revoke the current session and clear the cookie |
| GET | `/api/auth/session` | Return the current user or `401` |

There is no public registration endpoint. Superadmin accounts are created through the seed command.

## Submissions and approvals

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/submissions?q=&status=&page=&pageSize=` | List submissions visible to the current user |
| POST | `/api/submissions` | Create a draft with category and one or more items |
| GET | `/api/submissions/{id}` | Read details, actions, revisions, and attachment metadata |
| PATCH | `/api/submissions/{id}` | Edit a draft or a submission returned for revision |
| POST | `/api/submissions/{id}/submit` | Submit a draft into its configured workflow |
| POST | `/api/submissions/{id}/revision` | Resubmit changes to the same workflow step that requested revision |
| POST | `/api/submissions/{id}/actions` | Approve, reject, request revision, give consideration, or skip an optional step |
| POST | `/api/submissions/{id}/attachments` | Upload a multipart `file` field while the request is draft or in revision |
| GET | `/api/submissions/{id}/attachments/{attachmentId}` | Download an authorized attachment |
| GET | `/api/approvals/inbox` | List tasks waiting for the current user's action |

Create and edit bodies use this shape:

```json
{
  "categoryId": "uuid",
  "items": [
    {
      "name": "Laptop",
      "quantity": 2,
      "unitPrice": 15000000,
      "description": "Untuk staf baru",
      "specification": "Core i7, RAM 16 GB, SSD 512 GB"
    }
  ]
}
```

For edits, omit `categoryId`; category and workflow are fixed after draft creation. Action bodies use `{ "action": "APPROVE", "note": "..." }`. `REJECT`, `REQUEST_REVISION`, and `CONSIDERATION` require a note. `SKIP` is accepted only for a step configured as optional.

## Administration

These endpoints require the `SUPERADMIN` role.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET, POST | `/api/admin/users` | List and create users |
| PATCH | `/api/admin/users/{userId}` | Change user profile, role, unit, password, or active status |
| GET, POST | `/api/admin/units` | List and create units |
| PATCH | `/api/admin/units/{unitId}` | Change a unit, manager, or active status |
| GET, POST | `/api/admin/categories` | List and create categories |
| PATCH | `/api/admin/categories/{categoryId}` | Rename or deactivate a category |
| GET | `/api/admin/workflows` | List categories and workflow steps |
| PUT | `/api/admin/workflows/{categoryId}` | Replace the category workflow and ordered steps |

Workflow replacement requires an approval step assigned to the requester's Unit Manager first and an approval step last. Steps can target the Unit Manager, an active role, or a specific active user.

## Dashboard and notifications

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard` | Return pending, approved, rejected, and average final-decision duration in milliseconds |
| GET | `/api/notifications?page=&pageSize=` | List the current user's notifications and unread count |
| PATCH | `/api/notifications/{notificationId}` | Mark one of the current user's notifications as read |

## Local setup

Copy `.env.example` to `.env`, create the MySQL database named in `DATABASE_URL`, and set a unique Superadmin password with at least 12 characters. Run `bun run db:migrate` and `bun run db:seed`. Attachments default to `./private/attachments`, outside the public directory; use persistent storage for any production deployment.
