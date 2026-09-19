import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../../src/App";
describe("Frontend Authentication & Role Views (Issue 3.5)", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });
    it("renders login form when no active user session exists", async () => {
        global.fetch = vi.fn().mockImplementation((url) => {
            if (String(url).includes("/auth/me")) {
                return Promise.resolve({ ok: false, status: 401 });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });
        render(_jsx(App, {}));
        expect(await screen.findByRole("button", { name: /Sign In/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("user@toktickit.local")).toBeInTheDocument();
    });
    it("renders forced password change screen if mustChangePassword is true", async () => {
        localStorage.setItem("toktickit_token", "fake-token");
        global.fetch = vi.fn().mockImplementation((url) => {
            if (String(url).includes("/auth/me")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        user: {
                            id: "user-1",
                            email: "staff@toktickit.local",
                            fullName: "Staff Member",
                            role: "IT_STAFF",
                            mustChangePassword: true,
                        },
                    }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });
        render(_jsx(App, {}));
        expect(await screen.findByText(/Password Change Required/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Update Password & Continue/i })).toBeInTheDocument();
    });
    it("renders staff queue navigation tab for IT_STAFF role", async () => {
        localStorage.setItem("toktickit_token", "fake-token");
        global.fetch = vi.fn().mockImplementation((url) => {
            if (String(url).includes("/auth/me")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        user: {
                            id: "staff-1",
                            email: "staff@toktickit.local",
                            fullName: "IT Specialist",
                            role: "IT_STAFF",
                            mustChangePassword: false,
                        },
                    }),
                });
            }
            if (String(url).includes("/staff/tickets")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ items: [], total: 0 }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });
        render(_jsx(App, {}));
        expect(await screen.findByRole("button", { name: /Staff Queue/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /User Management/i })).not.toBeInTheDocument();
    });
    it("renders user management navigation tab for ADMINISTRATOR role", async () => {
        localStorage.setItem("toktickit_token", "fake-token");
        global.fetch = vi.fn().mockImplementation((url) => {
            if (String(url).includes("/auth/me")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        user: {
                            id: "admin-1",
                            email: "admin@toktickit.local",
                            fullName: "System Admin",
                            role: "ADMINISTRATOR",
                            mustChangePassword: false,
                        },
                    }),
                });
            }
            if (String(url).includes("/admin/users")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ users: [], total: 0 }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
        });
        render(_jsx(App, {}));
        expect(await screen.findByRole("button", { name: /User Management/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Staff Queue/i })).toBeInTheDocument();
    });
});
