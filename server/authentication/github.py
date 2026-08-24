import json
import os
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings
from rest_framework.exceptions import ValidationError

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API_URL = "https://api.github.com/user"
GITHUB_EMAILS_API_URL = "https://api.github.com/user/emails"


def get_github_authorization_url(redirect_uri=None):
    """
    Construct the GitHub OAuth authorization URL.
    """
    client_id = getattr(settings, 'GITHUB_CLIENT_ID', '') or os.getenv('GITHUB_CLIENT_ID', '') or ''
    target_redirect_uri = (
        redirect_uri
        or getattr(settings, 'GITHUB_REDIRECT_URI', '')
        or os.getenv('GITHUB_REDIRECT_URI', '')
        or ''
    )

    params = {
        'client_id': client_id,
        'scope': 'user:email',
    }
    if target_redirect_uri:
        params['redirect_uri'] = target_redirect_uri

    return f"{GITHUB_AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code_for_token(code, redirect_uri=None):
    """
    Exchange the authorization code for a GitHub access token.
    """
    client_id = getattr(settings, 'GITHUB_CLIENT_ID', '') or os.getenv('GITHUB_CLIENT_ID', '') or ''
    client_secret = getattr(settings, 'GITHUB_CLIENT_SECRET', '') or os.getenv('GITHUB_CLIENT_SECRET', '') or ''
    target_redirect_uri = (
        redirect_uri
        or getattr(settings, 'GITHUB_REDIRECT_URI', '')
        or os.getenv('GITHUB_REDIRECT_URI', '')
        or ''
    )

    if not client_id or not client_secret:
        raise ValidationError({"detail": "GitHub OAuth is not configured on the server (missing Client ID or Secret)."})

    payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code,
    }
    if target_redirect_uri:
        payload['redirect_uri'] = target_redirect_uri

    headers = {
        'Accept': 'application/json',
        'User-Agent': 'Ahoum-Marketplace',
        'Content-Type': 'application/json',
    }

    req = urllib.request.Request(
        GITHUB_TOKEN_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers=headers,
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
    except (urllib.error.URLError, TimeoutError) as e:
        raise ValidationError({"detail": f"Failed to communicate with GitHub token service: {str(e)}"})

    if 'error' in data:
        error_desc = data.get('error_description', data.get('error', 'OAuth authorization failed'))
        raise ValidationError({"detail": f"GitHub authorization error: {error_desc}"})

    access_token = data.get('access_token')
    if not access_token:
        raise ValidationError({"detail": "No access token received from GitHub."})

    return access_token


def get_github_user_info(access_token):
    """
    Fetch the authenticated GitHub user's profile and verified email.
    """
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Ahoum-Marketplace',
    }

    # 1. Fetch user profile
    user_req = urllib.request.Request(GITHUB_USER_API_URL, headers=headers, method='GET')
    try:
        with urllib.request.urlopen(user_req, timeout=10) as response:
            user_data = json.loads(response.read().decode('utf-8'))
    except (urllib.error.URLError, TimeoutError) as e:
        raise ValidationError({"detail": f"Failed to fetch GitHub profile: {str(e)}"})

    email = user_data.get('email')

    # 2. If email is not public on profile, fetch from /user/emails
    if not email:
        emails_req = urllib.request.Request(GITHUB_EMAILS_API_URL, headers=headers, method='GET')
        try:
            with urllib.request.urlopen(emails_req, timeout=10) as response:
                emails_data = json.loads(response.read().decode('utf-8'))
        except (urllib.error.URLError, TimeoutError) as e:
            raise ValidationError({"detail": f"Failed to fetch GitHub emails: {str(e)}"})

        # Search for primary and verified email
        verified_primary = next((e['email'] for e in emails_data if e.get('primary') and e.get('verified')), None)
        if verified_primary:
            email = verified_primary
        else:
            # Fallback to any verified email
            any_verified = next((e['email'] for e in emails_data if e.get('verified')), None)
            if any_verified:
                email = any_verified

    if not email:
        raise ValidationError({"detail": "Unable to retrieve a verified email address from your GitHub account."})

    name = user_data.get('name') or user_data.get('login') or email.split('@')[0]

    return {
        'email': email.lower().strip(),
        'name': name.strip(),
        'github_id': user_data.get('id'),
        'avatar_url': user_data.get('avatar_url'),
    }
