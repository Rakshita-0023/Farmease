# Security policy

Please do not open public issues for suspected vulnerabilities, exposed credentials, authentication bypasses, or sensitive data disclosure. Report them privately to the repository owner through GitHub's private vulnerability reporting feature, or contact the maintainer listed on the repository profile.

Include a clear description, affected path or endpoint, reproduction steps, impact, and any proposed mitigation. We will acknowledge reports as soon as practical, investigate before disclosure, and credit reporters only with their permission.

## Supported configuration

Security fixes target the default branch. Deployments must provide a strong `JWT_SECRET`, explicit `CORS_ORIGINS` / `FARMEASE_CORS_ORIGINS`, TLS, and provider keys through environment variables. Do not use the example values in production.

FarmEase is not a substitute for agronomic, medical, legal, or financial advice. Model and provider outputs should be reviewed in the context of local conditions.
## Dependency status

Known npm audit findings are tracked transparently in
[docs/DEPENDENCY_AUDIT.md](docs/DEPENDENCY_AUDIT.md). They are not a substitute
for a security audit.
