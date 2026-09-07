output "alb_dns_name" {
  value = aws_lb.public.dns_name
}

output "core_url" {
  value = var.enable_https ? "https://${aws_lb.public.dns_name}" : "http://${aws_lb.public.dns_name}"
}

output "ecr_core_repository_url" {
  value = aws_ecr_repository.core.repository_url
}

output "ecr_ml_repository_url" {
  value = aws_ecr_repository.ml.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "core_service_name" {
  value = aws_ecs_service.core.name
}

output "ml_service_name" {
  value = aws_ecs_service.ml.name
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "github_deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}
