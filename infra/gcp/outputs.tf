output "wif_provider_uri" {
  value       = "projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${google_iam_workload_identity_pool.github_actions.workload_identity_pool_id}/providers/${google_iam_workload_identity_pool_provider.github_oidc.workload_identity_pool_provider_id}"
  description = "GitHub Actions OIDC provider resource URI"
}

output "cloud_run_url" {
  value       = google_cloud_run_v2_service.web.uri
  description = "Cloud Run service URL"
}

output "custom_domain" {
  value       = "https://${google_cloud_run_domain_mapping.rpldr_golbi_ai.name}"
  description = "Public custom domain"
}

output "artifact_registry_repository" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.web.repository_id}"
  description = "Container registry path"
}

output "deployer_service_account_email" {
  value       = google_service_account.deployer.email
  description = "GitHub Actions CD service account"
}
