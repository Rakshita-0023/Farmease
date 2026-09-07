# FarmEase AWS infrastructure

This directory defines the cost-conscious AWS production shape: one VPC with
two Availability Zones, public ALB, public-subnet Fargate tasks with public IPs
but task security groups that accept traffic only from the ALB/Core security
groups, private RDS subnets, Cloud Map private DNS for Core → ML, ECR, and
CloudWatch logs. There is intentionally no NAT Gateway, which avoids a fixed
monthly charge; ECS tasks use public egress for ECR and provider APIs while no
task port is open to the internet.

The database is private and uses RDS-managed master credentials. ECS receives
the username/password JSON fields through Secrets Manager references. Core
constructs its supported PostgreSQL connection from `DB_HOST`, `DB_NAME`,
`DB_USER`, and `DB_PASSWORD`, so a plaintext `DATABASE_URL` is not required in
Terraform or the task definition.

## One-time bootstrap

Create the encrypted/versioned Terraform state bucket and lock table from
`bootstrap/` using an authenticated AWS session. Then configure the backend
block values in the production workspace:

```bash
terraform -chdir=infra/aws/bootstrap init
terraform -chdir=infra/aws/bootstrap apply
terraform -chdir=infra/aws init \
  -backend-config="bucket=<state-bucket>" \
  -backend-config="key=farmease/production.tfstate" \
  -backend-config="region=ap-south-1" \
  -backend-config="encrypt=true" \
  -backend-config="use_lockfile=true"
```

Terraform's S3 backend supports S3-native locking with `use_lockfile`; no
DynamoDB table is needed for new setups. Existing workspaces that still use a
DynamoDB lock table should retain that backend setting during migration.

## Apply order

1. Create Secrets Manager values for `JWT_SECRET` and any optional provider keys.
2. Build/push immutable Core and ML images, or use the CD workflow.
3. Copy `terraform.tfvars.example` to an ignored `terraform.tfvars`, replacing
   image URIs and secret ARNs only.
4. Run `terraform fmt -check`, `terraform validate`, `terraform plan`.
5. Apply from a protected/manual environment only.
6. Run `npm run db:migrate` as an ECS one-off task using the
   Core task definition before the first service rollout or schema change.
7. Update ECS services and verify the ALB health endpoint.

The `db:migrate` command is idempotent and uses only `CREATE TABLE IF NOT
EXISTS`; it does not drop, truncate, or rewrite existing data. The application
startup retains the same non-destructive table-creation compatibility path.

## HTTPS and DNS

Without an owned domain and ACM certificate, the ALB output is an HTTP AWS DNS
name. Set `enable_https=true` and provide an ACM certificate ARN in the same
region after DNS ownership is available; HTTP then redirects to HTTPS.

## Rollback

ECS deployment circuit breakers roll back a failed deployment. For a manual
rollback, select the prior task-definition revision and update both services,
then wait for service stability and verify `/api/v1/health`.
