# FarmEase architecture

FarmEase keeps the Vercel reference farmer app separate from the Core API and
optional provider services. Local development uses SQLite; production uses
PostgreSQL through the same `db.js` abstraction. Weather and markets are
provider-backed and never filled with simulated production records.

For the AWS production topology, see [AWS deployment](AWS_DEPLOYMENT.md): a
public ALB fronts Core ECS Fargate tasks, Core reaches ML through private Cloud
Map DNS, and both tasks reach a private RDS PostgreSQL database according to
security-group rules. GitHub Actions obtains short-lived AWS credentials with
OIDC and deploys immutable SHA-tagged ECR images.
