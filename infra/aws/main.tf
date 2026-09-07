locals {
  azs         = slice(data.aws_availability_zones.available.names, 0, 2)
  name_prefix = "${var.project_name}-${var.environment}"
  core_port   = 5001
  ml_port     = 8000
  db_name     = "farmease"
  db_user_key = "${aws_db_instance.main.master_user_secret[0].secret_arn}:username::"
  db_pass_key = "${aws_db_instance.main.master_user_secret[0].secret_arn}:password::"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = local.azs[count.index]
}

resource "aws_subnet" "database" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = local.azs[count.index]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  route_table_id = aws_route_table.private.id
  subnet_id      = aws_subnet.private[count.index].id
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route_table_association" "database" {
  count          = 2
  route_table_id = aws_route_table.database.id
  subnet_id      = aws_subnet.database[count.index].id
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Public ALB ingress"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.enable_https ? [1] : []
    content {
      protocol    = "tcp"
      from_port   = 443
      to_port     = 443
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "core" {
  name        = "${local.name_prefix}-core"
  description = "Core ECS task ingress only from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = local.core_port
    to_port         = local.core_port
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ml" {
  name        = "${local.name_prefix}-ml"
  description = "ML ECS task ingress only from Core"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = local.ml_port
    to_port         = local.ml_port
    security_groups = [aws_security_group.core.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds"
  description = "RDS ingress only from Core ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = 5432
    to_port         = 5432
    security_groups = [aws_security_group.core.id]
  }
}

resource "aws_ecr_repository" "core" {
  name                 = "${var.project_name}-core"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "ml" {
  name                 = "${var.project_name}-ml"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_cloudwatch_log_group" "core" {
  name              = "/ecs/${local.name_prefix}/core"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "ml" {
  name              = "/ecs/${local.name_prefix}/ml"
  retention_in_days = 30
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db"
  subnet_ids = aws_subnet.database[*].id
}

resource "aws_db_instance" "main" {
  identifier                  = "${local.name_prefix}-postgres"
  engine                      = "postgres"
  engine_version              = "16"
  instance_class              = var.db_instance_class
  allocated_storage           = 20
  max_allocated_storage       = 50
  storage_type                = "gp3"
  db_name                     = local.db_name
  username                    = "farmease"
  manage_master_user_password = true
  port                        = 5432
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.rds.id]
  publicly_accessible         = false
  backup_retention_period     = var.db_backup_retention_days
  copy_tags_to_snapshot       = true
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${local.name_prefix}-final"
  apply_immediately           = false
}

resource "aws_service_discovery_private_dns_namespace" "main" {
  name = "farmease.local"
  vpc  = aws_vpc.main.id
}

resource "aws_service_discovery_service" "ml" {
  name = "ml"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }
}

resource "aws_ecs_cluster" "main" {
  name = local.name_prefix
  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "${local.name_prefix}-ecs-execution"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_secrets" {
  name   = "${local.name_prefix}-ecs-secrets"
  role   = aws_iam_role.ecs_execution.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = compact([var.jwt_secret_arn, aws_db_instance.main.master_user_secret[0].secret_arn, var.agmarknet_api_key_secret_arn, var.google_client_id_secret_arn, var.sentinel_access_token_secret_arn]) }] })
}

resource "aws_iam_role" "ecs_task" {
  name               = "${local.name_prefix}-ecs-task"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}

resource "aws_ecs_task_definition" "ml" {
  family                   = "${local.name_prefix}-ml"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ml_cpu
  memory                   = var.ml_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions    = jsonencode([{ name = "ml", image = var.ml_image, essential = true, portMappings = [{ containerPort = local.ml_port, hostPort = local.ml_port, protocol = "tcp" }], environment = [{ name = "PORT", value = tostring(local.ml_port) }, { name = "FARMEASE_CORS_ORIGINS", value = var.cors_origins }, { name = "FARMEASE_DOWNLOAD_MODELS", value = "false" }], logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = aws_cloudwatch_log_group.ml.name, "awslogs-region" = var.aws_region, "awslogs-stream-prefix" = "ecs" } }, healthCheck = { command = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5)\""], interval = 30, timeout = 10, retries = 3, startPeriod = 120 } }])
}

resource "aws_ecs_task_definition" "core" {
  family                   = "${local.name_prefix}-core"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.core_cpu
  memory                   = var.core_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions    = jsonencode([{ name = "core", image = var.core_image, essential = true, portMappings = [{ containerPort = local.core_port, hostPort = local.core_port, protocol = "tcp" }], environment = [{ name = "NODE_ENV", value = "production" }, { name = "PORT", value = tostring(local.core_port) }, { name = "DB_HOST", value = aws_db_instance.main.address }, { name = "DB_PORT", value = "5432" }, { name = "DB_NAME", value = local.db_name }, { name = "CORS_ORIGINS", value = var.cors_origins }, { name = "ML_API_URL", value = "http://ml.farmease.local:8000" }, { name = "PLANT_DOCTOR_API_URL", value = "http://ml.farmease.local:8000" }, { name = "MARKET_DATA_MODE", value = var.market_data_mode }], secrets = concat([{ name = "DB_USER", valueFrom = local.db_user_key }, { name = "DB_PASSWORD", valueFrom = local.db_pass_key }, { name = "JWT_SECRET", valueFrom = var.jwt_secret_arn }], var.agmarknet_api_key_secret_arn != "" ? [{ name = "AGMARKNET_API_KEY", valueFrom = var.agmarknet_api_key_secret_arn }] : [], var.google_client_id_secret_arn != "" ? [{ name = "GOOGLE_CLIENT_ID", valueFrom = var.google_client_id_secret_arn }] : [], var.sentinel_access_token_secret_arn != "" ? [{ name = "SENTINEL_ACCESS_TOKEN", valueFrom = var.sentinel_access_token_secret_arn }] : []), logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = aws_cloudwatch_log_group.core.name, "awslogs-region" = var.aws_region, "awslogs-stream-prefix" = "ecs" } }, healthCheck = { command = ["CMD-SHELL", "node -e \"require('http').get('http://127.0.0.1:5001/api/v1/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))\""], interval = 30, timeout = 10, retries = 3, startPeriod = 30 } }])
}

resource "aws_lb" "public" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "core" {
  name        = "${local.name_prefix}-core"
  port        = local.core_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  health_check {
    path                = "/api/v1/health"
    matcher             = "200"
    interval            = 30
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = var.enable_https ? "redirect" : "forward"
    target_group_arn = var.enable_https ? null : aws_lb_target_group.core.arn
    dynamic "redirect" {
      for_each = var.enable_https ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = var.enable_https ? 1 : 0
  load_balancer_arn = aws_lb.public.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.core.arn
  }
}

resource "aws_ecs_service" "ml" {
  name                               = "${local.name_prefix}-ml"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.ml.arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  enable_execute_command             = false
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ml.id]
    assign_public_ip = true
  }
  service_registries {
    registry_arn = aws_service_discovery_service.ml.arn
  }
}

resource "aws_ecs_service" "core" {
  name                               = "${local.name_prefix}-core"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.core.arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  enable_execute_command             = false
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.core.id]
    assign_public_ip = true
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.core.arn
    container_name   = "core"
    container_port   = local.core_port
  }
  depends_on = [aws_lb_listener.http, aws_iam_role_policy_attachment.ecs_execution, aws_iam_role_policy.ecs_secrets]
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github_actions.certificates[0].sha1_fingerprint]
  lifecycle { prevent_destroy = true }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${local.name_prefix}-github-deploy"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Federated = aws_iam_openid_connect_provider.github.arn }, Action = "sts:AssumeRoleWithWebIdentity", Condition = { StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }, StringLike = { "token.actions.githubusercontent.com:sub" = ["repo:${var.github_repository}:ref:refs/heads/${var.github_branch}", "repo:${var.github_repository}:ref:refs/tags/v*"] } } }] })
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "${local.name_prefix}-github-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" }, { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:CompleteLayerUpload", "ecr:InitiateLayerUpload", "ecr:PutImage", "ecr:UploadLayerPart"], Resource = [aws_ecr_repository.core.arn, aws_ecr_repository.ml.arn] }, { Effect = "Allow", Action = ["ecs:DescribeServices", "ecs:DescribeTaskDefinition", "ecs:ListTasks", "ecs:RegisterTaskDefinition", "ecs:UpdateService"], Resource = "*" }, { Effect = "Allow", Action = ["iam:PassRole"], Resource = [aws_iam_role.ecs_execution.arn, aws_iam_role.ecs_task.arn] }] })
}
