variable "project_id" {
  type        = string
  description = "Shared Golbi GCP project"
  default     = "the-bird-499021-m8"
}

variable "region" {
  type        = string
  description = "Cloud Run and Artifact Registry region"
  default     = "us-central1"
}

variable "service_name" {
  type        = string
  description = "Cloud Run service name"
  default     = "rope-ladder-web"
}

variable "placeholder_image" {
  type        = string
  description = "Only used to create the service before CD supplies its immutable image"
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}
