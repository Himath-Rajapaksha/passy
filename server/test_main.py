import pytest
from fastapi.testclient import TestClient

from main import CSP, DIST_DIR, app

client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_security_headers_are_present():
    response = client.get("/healthz")
    assert response.headers["content-security-policy"] == CSP
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["x-frame-options"] == "DENY"


@pytest.mark.skipif(
    not (DIST_DIR / "index.html").is_file(),
    reason="dist/ is not built",
)
def test_serves_the_built_app():
    response = client.get("/")
    assert response.status_code == 200
    assert "Passy" in response.text
    assert response.headers["content-security-policy"] == CSP


def test_no_endpoint_accepts_a_body():
    response = client.post("/healthz", json={"phrase": "do not send this"})
    assert response.status_code == 405


def test_no_api_schema_is_exposed():
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404
