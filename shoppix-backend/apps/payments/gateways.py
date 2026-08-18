"""
Thin, swappable clients around Paystack and Opay's REST APIs. Both expose the
same three operations (initialize, verify, webhook-signature-check) behind a
common interface so the view layer never needs to know which gateway a
payment used.
"""
import hashlib
import hmac
import logging
import uuid

import requests
from django.conf import settings

logger = logging.getLogger("apps.payments")


class GatewayError(Exception):
    pass


class BaseGateway:
    name = None

    def initialize(self, *, email, amount_kobo, reference, callback_url, metadata=None):
        raise NotImplementedError

    def verify(self, reference):
        raise NotImplementedError

    def verify_webhook_signature(self, request) -> bool:
        raise NotImplementedError

    @staticmethod
    def _safe_json(resp):
        """requests.Response.json() raises an uncaught JSONDecodeError if the
        upstream returns anything non-JSON (a proxy/allowlist block page, a
        gateway outage page, a timeout gateway's HTML error, etc). Any such
        response should surface as a clean GatewayError, not a 500."""
        try:
            return resp.json()
        except ValueError:
            snippet = resp.text[:200] if resp.text else "(empty response)"
            raise GatewayError(
                f"Payment gateway returned an unexpected response (HTTP {resp.status_code}): {snippet}"
            )


class PaystackGateway(BaseGateway):
    name = "paystack"
    BASE_URL = "https://api.paystack.co"

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY

    def _headers(self):
        return {"Authorization": f"Bearer {self.secret_key}", "Content-Type": "application/json"}

    def initialize(self, *, email, amount_kobo, reference, callback_url, metadata=None):
        resp = requests.post(
            f"{self.BASE_URL}/transaction/initialize",
            json={
                "email": email,
                "amount": amount_kobo,
                "reference": reference,
                "callback_url": callback_url,
                "metadata": metadata or {},
            },
            headers=self._headers(),
            timeout=15,
        )
        data = self._safe_json(resp)
        if not resp.ok or not data.get("status"):
            raise GatewayError(data.get("message", "Failed to initialize Paystack transaction."))
        return {
            "authorization_url": data["data"]["authorization_url"],
            "access_code": data["data"]["access_code"],
            "reference": data["data"]["reference"],
        }

    def verify(self, reference):
        resp = requests.get(f"{self.BASE_URL}/transaction/verify/{reference}", headers=self._headers(), timeout=15)
        data = self._safe_json(resp)
        if not resp.ok or not data.get("status"):
            raise GatewayError(data.get("message", "Failed to verify Paystack transaction."))
        tx = data["data"]
        return {
            "successful": tx.get("status") == "success",
            "amount_kobo": tx.get("amount"),
            "raw": tx,
        }

    def verify_webhook_signature(self, request) -> bool:
        signature = request.headers.get("x-paystack-signature", "")
        computed = hmac.new(self.secret_key.encode(), request.body, hashlib.sha512).hexdigest()
        return hmac.compare_digest(signature, computed)


class OpayGateway(BaseGateway):
    name = "opay"
    BASE_URL = "https://api.opaycheckout.com/api/v1/international/cashier"

    def __init__(self):
        self.secret_key = settings.OPAY_SECRET_KEY
        self.merchant_id = settings.OPAY_MERCHANT_ID

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "MerchantId": self.merchant_id,
            "Content-Type": "application/json",
        }

    def initialize(self, *, email, amount_kobo, reference, callback_url, metadata=None):
        resp = requests.post(
            f"{self.BASE_URL}/create",
            json={
                "reference": reference,
                "amount": {"total": amount_kobo, "currency": "NGN"},
                "returnUrl": callback_url,
                "callbackUrl": callback_url,
                "userInfo": {"userEmail": email},
                "productList": [{"name": "Shoppix order", "description": "Shoppix order", "price": amount_kobo, "quantity": 1}],
            },
            headers=self._headers(),
            timeout=15,
        )
        data = self._safe_json(resp)
        if not resp.ok or data.get("code") != "00000":
            raise GatewayError(data.get("message", "Failed to initialize Opay transaction."))
        return {
            "authorization_url": data["data"]["cashierUrl"],
            "access_code": data["data"].get("orderNo", ""),
            "reference": reference,
        }

    def verify(self, reference):
        resp = requests.post(
            f"{self.BASE_URL}/status",
            json={"reference": reference},
            headers=self._headers(),
            timeout=15,
        )
        data = self._safe_json(resp)
        if not resp.ok or data.get("code") != "00000":
            raise GatewayError(data.get("message", "Failed to verify Opay transaction."))
        tx = data["data"]
        return {
            "successful": tx.get("status") == "SUCCESS",
            "amount_kobo": tx.get("amount", {}).get("total"),
            "raw": tx,
        }

    def verify_webhook_signature(self, request) -> bool:
        signature = request.headers.get("signature", "")
        computed = hmac.new(self.secret_key.encode(), request.body, hashlib.sha512).hexdigest()
        return hmac.compare_digest(signature, computed)


GATEWAYS = {
    "paystack": PaystackGateway,
    "opay": OpayGateway,
}


def get_gateway(name: str) -> BaseGateway:
    try:
        return GATEWAYS[name]()
    except KeyError:
        raise GatewayError(f"Unsupported payment method '{name}'.")


def generate_payment_reference() -> str:
    return f"SHXPAY-{uuid.uuid4().hex[:14].upper()}"
