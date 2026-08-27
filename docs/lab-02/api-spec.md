# Lab 2 API Specification

## Endpoints
* `GET /api/requesters/active` - List active requesters.
* `POST /api/tickets` - Create a ticket (Headers: `x-requester-id`).
* `GET /api/tickets` - Retrieve requester-isolated tickets (Filters: `search`, `status`, `category`, `page`, `limit`).
* `GET /api/tickets/:id` - Fetch ticket details and metadata.
* `POST /api/tickets/:id/attachments` - Upload attachments (max 5, <= 5MB, JPG/PNG/WEBP/PDF).
* `PATCH /api/attachments/:id/soft-remove` - Soft-remove attachment with `reason`.
