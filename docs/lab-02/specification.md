# Lab 2 Sprint Specification: Requester Ticket Management

## 1. Overview & Goals
Enable authenticated Requester actions: switching active context, submitting support tickets with attachments, viewing isolated tickets, and soft-removing attachments with an audit trail.

## 2. Core Functional Requirements
* **Requester Context**: Maintain and toggle active test requester identity; append `x-requester-id` to API calls.
* **Ticket Creation**: Validate required fields, generate formatted IDs (`TKT-YYYY-XXXXXX`), and accept up to 5 attachments (<= 5MB).
* **Ticket Isolation**: Requester views only their own submitted tickets.
* **Attachment Lifecycle**: Support non-destructive soft removal requiring a valid user explanation.
