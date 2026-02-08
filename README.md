# ![ReleaseRadar icon](https://github.com/user-attachments/assets/708a36da-1331-496f-9416-59e633c6cf2b) ReleaseRadar

![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?logo=html5&logoColor=white) ![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow?logo=javascript) ![CSS3](https://img.shields.io/badge/CSS-563d7c?&style=flat&logo=css&logoColor=white) [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?logo=github)](https://comet-builds.github.io/ReleaseRadar/) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=bugs)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![CodeFactor](https://www.codefactor.io/repository/github/comet-builds/ReleaseRadar/badge)](https://www.codefactor.io/repository/github/comet-builds/ReleaseRadar)

ReleaseRadar is a browser‑only dashboard for tracking GitHub repository releases. It runs entirely in the browser with no backend and no setup.

## Features
- Uses public GitHub API.
- Customizable auto-refresh interval.
- Support for GitHub personal access tokens (no scopes required).
- Export/Import to allow transferring of repo list and settings to another device.
- Installable as a desktop web application.
- Light and Dark theme.

## Quick Start
1. Open the app: https://comet-builds.github.io/ReleaseRadar/
2. Add one or more GitHub repositories.
3. (Optional) Add a GitHub Personal Access Token to increase rate limits.
4. Set your refresh interval and theme.

## Preview
<img alt="preview" src="https://github.com/user-attachments/assets/82f204f2-35fd-4326-9b3b-5cf149d19e99"/>

## Release Handling
ReleaseRadar distinguishes between **stable releases** and **pre-releases** using GitHub’s `prerelease` flag. A pre-release is shown only if it is newer than the latest stable release. Releases are sorted by publish date (`published_at`).
