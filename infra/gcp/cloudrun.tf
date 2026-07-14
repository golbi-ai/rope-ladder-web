resource "google_service_account" "runtime" {
  account_id   = "rope-ladder-web-runtime"
  display_name = "rope-ladder-web Cloud Run runtime"
}

resource "google_project_iam_member" "runtime_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}

# CD owns image revisions and traffic. OpenTofu owns the service's identity,
# reachability, scaling, and startup contract.
resource "google_cloud_run_v2_service" "web" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  # The shared project's domain-restricted-sharing policy rejects allUsers IAM
  # members. This is intentionally public content, so Cloud Run's dedicated
  # public-invocation control is used instead of an allUsers binding.
  invoker_iam_disabled = true

  scaling {
    min_instance_count = 0
  }

  template {
    service_account = google_service_account.runtime.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = var.placeholder_image

      ports {
        container_port = 8080
      }

      startup_probe {
        tcp_socket {
          port = 8080
        }
      }
    }
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      template[0].containers[0].image,
      template[0].revision,
      client,
      client_version,
    ]
  }

  depends_on = [google_project_service.apis]
}

# Google manages the certificate after domain verification. External DNS stays
# deliberately outside Terraform; see README.md for the sole CNAME record.
resource "google_cloud_run_domain_mapping" "rpldr_golbi_ai" {
  name     = "rpldr.golbi.ai"
  location = var.region
  project  = var.project_id

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name       = google_cloud_run_v2_service.web.name
    certificate_mode = "AUTOMATIC"
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_cloud_run_v2_service.web]
}
