# This identity is intentionally bootstrap-created and referenced as data: an
# infrastructure apply workflow must not own the lifecycle of its own admin
# identity. README.md provides the one-time owner commands.
data "google_service_account" "tofu_apply" {
  account_id = "rope-ladder-web-tofu-apply"
}

resource "google_service_account_iam_member" "tofu_apply_act_as_runtime" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${data.google_service_account.tofu_apply.email}"
}

# Only the reviewed, main-branch apply workflow can obtain the broad bootstrap
# identity. A bare repository trust binding would be too broad here.
resource "google_service_account_iam_member" "tofu_apply_wif" {
  service_account_id = data.google_service_account.tofu_apply.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_actions.name}/attribute.workflow_ref/golbi-ai/rope-ladder-web/.github/workflows/infra-apply.yml@refs/heads/main"
}
