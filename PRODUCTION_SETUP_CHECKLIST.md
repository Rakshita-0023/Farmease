# FarmEase production setup checklist

FarmEase is migrating backend infrastructure from Render to AWS while keeping
the existing Vercel frontend and Render services as fallback.

## AWS prerequisites

- [ ] AWS account access is available through a temporary session or SSO.
- [ ] Region is selected as `ap-south-1`.
- [ ] An encrypted/versioned Terraform S3 state bucket is bootstrapped.
- [ ] A Secrets Manager value exists for `JWT_SECRET`.
- [ ] Optional provider secrets are created separately when needed.

## Build and infrastructure

- [ ] `docker compose up --build` passes locally.
- [ ] Core and ML images are tagged with the Git commit SHA.
- [ ] ECR repositories exist: `farmease-core` and `farmease-ml`.
- [ ] Terraform plan has been reviewed in the protected AWS environment.
- [ ] ECS Core and ML services are stable.
- [ ] RDS PostgreSQL is private and reachable only from Core.
- [ ] ALB targets are healthy.

## Production verification

- [ ] Core `/api/v1/health` reports database `ready`.
- [ ] Core Swagger and OpenAPI respond.
- [ ] ML `/health` and `/predict-crop` respond.
- [ ] Core crop recommendation reaches ML.
- [ ] CORS allows only the intended production frontend origin.
- [ ] Published Python and TypeScript SDKs pass live weather/market checks.
- [ ] Render remains available until AWS passes the full smoke test.

See [AWS deployment](docs/AWS_DEPLOYMENT.md) for exact commands, migration,
rollback, OIDC, secrets, and cost guidance.
