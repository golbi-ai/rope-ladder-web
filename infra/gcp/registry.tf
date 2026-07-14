resource "google_artifact_registry_repository" "web" {
  repository_id = "rope-ladder-web"
  location      = var.region
  format        = "DOCKER"
  description   = "rope-ladder-web container images"
}
