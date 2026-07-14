terraform {
  required_version = ">= 1.8"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.30.0"
    }
  }

  # Shared state bucket; this service has its own prefix and owns no other
  # service's state or resources.
  backend "gcs" {
    bucket = "the-bird-499021-m8-tofu-state"
    prefix = "rope-ladder-web"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
