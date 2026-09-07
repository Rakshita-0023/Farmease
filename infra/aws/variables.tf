variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "project_name" {
  type    = string
  default = "farmease"
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}

variable "core_image" {
  type        = string
  description = "Immutable ECR image URI including a commit SHA tag."
}

variable "ml_image" {
  type        = string
  description = "Immutable ECR image URI including a commit SHA tag."
}

variable "jwt_secret_arn" {
  type        = string
  description = "Secrets Manager ARN containing the JWT_SECRET value."
}

variable "agmarknet_api_key_secret_arn" {
  type        = string
  default     = ""
  description = "Optional Secrets Manager ARN containing AGMARKNET_API_KEY."
}

variable "google_client_id_secret_arn" {
  type        = string
  default     = ""
  description = "Optional Secrets Manager ARN containing GOOGLE_CLIENT_ID."
}

variable "sentinel_access_token_secret_arn" {
  type        = string
  default     = ""
  description = "Optional Secrets Manager ARN containing SENTINEL_ACCESS_TOKEN."
}

variable "sentinel_process_url" {
  type    = string
  default = ""
}

variable "market_data_mode" {
  type    = string
  default = "LIVE"
}

variable "cors_origins" {
  type    = string
  default = "https://farmease-zeta.vercel.app"
}

variable "core_cpu" {
  type    = number
  default = 512
}

variable "core_memory" {
  type    = number
  default = 1024
}

variable "ml_cpu" {
  type    = number
  default = 1024
}

variable "ml_memory" {
  type    = number
  default = 4096
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "acm_certificate_arn" {
  type        = string
  default     = ""
  description = "Optional ACM certificate ARN for an HTTPS ALB listener."
}

variable "enable_https" {
  type    = bool
  default = false
}

variable "github_repository" {
  type    = string
  default = "Rakshita-0023/Farmease"
}

variable "github_branch" {
  type    = string
  default = "main"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_backup_retention_days" {
  type    = number
  default = 7
}
