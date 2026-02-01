# ReleaseRadar

![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?logo=css3&logoColor=white) ![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow?logo=javascript) [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?logo=github)](https://comet-builds.github.io/ReleaseRadar/) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=comet-builds_ReleaseRadar&metric=bugs)](https://sonarcloud.io/summary/new_code?id=comet-builds_ReleaseRadar) [![CodeFactor](https://www.codefactor.io/repository/github/comet-builds/ReleaseRadar/badge)](https://www.codefactor.io/repository/github/comet-builds/ReleaseRadar)

ReleaseRadar is a browser‑only dashboard for tracking GitHub repository releases.

It runs entirely in the browser with no backend and no setup. Uses the public GitHub API.

![Screenshot of the app in action](https://i.imgur.com/qFvhB8U.png)

## Release Handling

ReleaseRadar distinguishes between **stable releases** and **pre-releases** using GitHub’s `prerelease` flag. A pre-release is shown only if it is newer than the latest stable release.

Releases are sorted strictly by publish date (`published_at`), not by version number.
