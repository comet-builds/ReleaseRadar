# ![icon](https://github.com/user-attachments/assets/708a36da-1331-496f-9416-59e633c6cf2b)<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#4f46e5"/><circle cx="32" cy="32" r="20" stroke="#fff" stroke-opacity=".2" stroke-width="4"/><circle cx="32" cy="32" r="15" stroke="#fff" stroke-opacity=".4" stroke-width="4"/><circle cx="32" cy="32" r="10" stroke="#fff" stroke-opacity=".6" stroke-width="4"/><path stroke="#fff" stroke-linecap="round" stroke-width="4" d="m32 32 14-14"/><circle cx="32" cy="32" r="4" fill="#fff"/></svg> ReleaseRadar

![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?logo=html5&logoColor=white) ![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow?logo=javascript) ![CSS3](https://img.shields.io/badge/CSS-563d7c?&style=flat&logo=css&logoColor=white) [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?logo=github)](https://comet-builds.github.io/ReleaseRadar/) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=bugs)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![CodeFactor](https://www.codefactor.io/repository/github/comet-builds/ReleaseRadar/badge)](https://www.codefactor.io/repository/github/comet-builds/ReleaseRadar)

ReleaseRadar is a browser‑only dashboard for tracking GitHub repository releases. It runs entirely in the browser with no backend and no setup.

## Features
- Uses public GitHub API.
- Customizable auto-refresh interval.
- Support for GitHub personal access tokens (no scopes required).
- Export/Import to allow transferring of repo list and settings to another device.
- Light and Dark theme.

## Quick Start
1. Open the app: https://comet-builds.github.io/ReleaseRadar/
2. Add one or more GitHub repositories.
3. (Optional) Add a GitHub Personal Access Token to increase rate limits.
4. Set your refresh interval and theme.

## Preview
<img alt="preview" src="https://github.com/user-attachments/assets/c5be7e09-480a-4cd7-a2e2-adc83714e985"/>

## Release Handling
ReleaseRadar distinguishes between **stable releases** and **pre-releases** using GitHub’s `prerelease` flag. A pre-release is shown only if it is newer than the latest stable release. Releases are sorted by publish date (`published_at`).
