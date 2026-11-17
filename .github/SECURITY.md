# Security policy

## Supported versions

No published release is currently available: the initial v1.0.0 release was withdrawn while community documentation is completed. Security fixes are developed on `main`; this is a development branch, not a promise of a supported production release. After publication, this policy will identify the supported release line.

## Report a vulnerability

Email **truongleanhvu20052004@gmail.com** with a subject beginning `Color Picker security report`. Do not open a public issue containing exploit details, sensitive URLs, screenshots, or credentials.

Include the affected commit/version, browser and OS versions, reproduction steps or a minimal proof of concept, impact, and any suggested mitigation. Share only the minimum data needed to investigate. Ordinary bugs can use the public issue tracker.

The maintainer will review reports as availability permits. There is no guaranteed response or remediation deadline and no bug bounty program. Please coordinate public disclosure with the maintainer so affected users can receive a fix.

## Relevant boundaries

The extension captures visible tab content on explicit user action and uses storage plus activeTab/scripting permissions. The closed shadow tree is not a general security boundary against browser tools. See [privacy](../docs/guides/PRIVACY.md) for screenshot and session-metadata handling. Do not test against other people's pages or data without authorization.
