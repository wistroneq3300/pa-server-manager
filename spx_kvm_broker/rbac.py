# -*- coding: utf-8 -*-
"""RBAC middleware for the Portal `/api/kvm/launch` endpoint and launch binding.

The Portal backend in this repo currently has NO auth/RBAC layer. This module
defines a *seam*: `PortalAuth` resolves the current portal user + session from
the incoming request (cookie or Bearer), and `rbac_allows` decides whether that
user may launch KVM for the given server. The concrete authentication provider
is configurable so the broker can be wired to the real Portal auth once it
exists, without changing the launch/binding logic.

Security: the launch endpoint must reject (403) when:
  - no valid Portal session (unauthenticated)   [PoC #1]
  - user lacks required role for that server    [PoC #2]
"""
from __future__ import annotations

import logging
from typing import Optional

log = logging.getLogger("spx_kvm_broker.rbac")

# Roles understood by the Portal. RBAC policy is a role->action matrix.
ROLE_VIEWER = "viewer"
ROLE_OPERATOR = "operator"
ROLE_ADMIN = "admin"


class PortalUser:
    def __init__(self, user_id: str, username: str, roles: list[str]):
        self.user_id = user_id
        self.username = username
        self.roles = list(roles)

    @property
    def is_authenticated(self) -> bool:
        return bool(self.user_id)

    def __repr__(self):
        return f"PortalUser({self.username}:{self.roles})"


class PortalAuth:
    """Resolves an authenticated portal user from an HTTP request.

    The concrete implementation must be provided by the Portal backend.
    The default NoAuthPortal returns an anonymous user (denies KVM launch),
    forcing the deployer to supply a real provider — fail-closed by design.
    """

    def authenticate(self, headers: dict, cookies: dict,
                     query: dict) -> Optional[PortalUser]:
        """Return a PortalUser or None (unauthenticated)."""
        raise NotImplementedError


class NoAuthPortal(PortalAuth):
    """Fail-closed placeholder: never authenticates anyone."""
    name = "noauth"

    def authenticate(self, headers, cookies, query):
        return None


def rbac_allows(user: Optional[PortalUser], server_id: str) -> bool:
    """RBAC policy: KVM remote-control launch requires operator or admin role.

    A viewer role cannot launch KVM (returns 403). Unknown/unauthenticated
    denied.
    """
    if user is None or not user.is_authenticated:
        return False
    return ROLE_OPERATOR in user.roles or ROLE_ADMIN in user.roles
