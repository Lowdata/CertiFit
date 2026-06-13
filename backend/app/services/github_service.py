from dataclasses import dataclass
from urllib.parse import urlparse
import logging

import requests

logger = logging.getLogger(__name__)

GITHUB_API_BASE_URL = "https://api.github.com"
REQUEST_TIMEOUT_SECONDS = 8
MAX_REPOS = 8
MAX_LANGUAGE_REPOS = 5
MAX_EVENTS = 10


@dataclass(frozen=True)
class GitHubIdentifier:
    username: str
    repo_owner: str | None = None
    repo_name: str | None = None


class GitHubClientError(Exception):
    pass


class GitHubNotFoundError(GitHubClientError):
    pass


def parse_github_identifier(identifier: str) -> GitHubIdentifier:
    value = identifier.strip()
    if not value:
        raise ValueError("GitHub username or URL is required")

    if "://" not in value and "/" not in value:
        return GitHubIdentifier(username=value)

    parsed = urlparse(value if "://" in value else f"https://github.com/{value}")
    host = parsed.netloc.lower()
    parts = [part for part in parsed.path.split("/") if part]

    if host not in {"github.com", "www.github.com"}:
        raise ValueError("GitHub URL must use github.com")

    if not parts:
        raise ValueError("GitHub URL must include a username")

    username = parts[0]
    if len(parts) >= 2:
        return GitHubIdentifier(
            username=username,
            repo_owner=username,
            repo_name=parts[1],
        )

    return GitHubIdentifier(username=username)


def _request_json(path: str):
    try:
        response = requests.get(
            f"{GITHUB_API_BASE_URL}{path}",
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "CertiFit-MVP",
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        logger.exception("Critical GitHub API request failure")
        raise GitHubClientError("GitHub API request failed") from exc

    if response.status_code == 404:
        raise GitHubNotFoundError("GitHub resource not found")

    if response.status_code >= 400:
        raise GitHubClientError("GitHub API returned an error")

    return response.json()


def _summarize_user(user: dict) -> dict:
    return {
        "login": user.get("login"),
        "id": user.get("id"),
        "html_url": user.get("html_url"),
        "name": user.get("name"),
        "company": user.get("company"),
        "blog": user.get("blog"),
        "location": user.get("location"),
        "bio": user.get("bio"),
        "public_repos": user.get("public_repos"),
        "public_gists": user.get("public_gists"),
        "followers": user.get("followers"),
        "following": user.get("following"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


def _summarize_repo(repo: dict, languages: dict | None = None) -> dict:
    return {
        "id": repo.get("id"),
        "name": repo.get("name"),
        "full_name": repo.get("full_name"),
        "html_url": repo.get("html_url"),
        "description": repo.get("description"),
        "fork": repo.get("fork"),
        "language": repo.get("language"),
        "languages": languages or {},
        "topics": repo.get("topics") or [],
        "stargazers_count": repo.get("stargazers_count"),
        "forks_count": repo.get("forks_count"),
        "open_issues_count": repo.get("open_issues_count"),
        "created_at": repo.get("created_at"),
        "updated_at": repo.get("updated_at"),
        "pushed_at": repo.get("pushed_at"),
        "default_branch": repo.get("default_branch"),
    }


def _summarize_event(event: dict) -> dict:
    return {
        "id": event.get("id"),
        "type": event.get("type"),
        "repo": event.get("repo", {}).get("name"),
        "created_at": event.get("created_at"),
    }


def analyze_github_profile(identifier: str) -> dict:
    parsed = parse_github_identifier(identifier)

    user = _request_json(f"/users/{parsed.username}")
    repos = _request_json(
        f"/users/{parsed.username}/repos?per_page={MAX_REPOS}&sort=updated"
    )
    events = _request_json(
        f"/users/{parsed.username}/events/public?per_page={MAX_EVENTS}"
    )

    selected_repo = None
    if parsed.repo_owner and parsed.repo_name:
        selected_repo = _request_json(
            f"/repos/{parsed.repo_owner}/{parsed.repo_name}"
        )

    repo_summaries = []
    language_totals: dict[str, int] = {}

    for repo in repos[:MAX_LANGUAGE_REPOS]:
        full_name = repo.get("full_name")
        languages = {}
        if full_name:
            languages = _request_json(f"/repos/{full_name}/languages")
            for language, bytes_count in languages.items():
                language_totals[language] = language_totals.get(language, 0) + bytes_count

        repo_summaries.append(
            _summarize_repo(
                repo=repo,
                languages=languages,
            )
        )

    selected_repo_summary = None
    if selected_repo:
        full_name = selected_repo.get("full_name")
        languages = _request_json(f"/repos/{full_name}/languages") if full_name else {}
        selected_repo_summary = _summarize_repo(
            repo=selected_repo,
            languages=languages,
        )

    return {
        "source": "github",
        "input": identifier,
        "username": parsed.username,
        "profile": _summarize_user(user),
        "repositories": repo_summaries,
        "selected_repository": selected_repo_summary,
        "language_totals": dict(
            sorted(
                language_totals.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        ),
        "recent_events": [
            _summarize_event(event)
            for event in events[:MAX_EVENTS]
        ],
    }
