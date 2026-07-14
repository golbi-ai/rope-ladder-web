data "google_project" "project" {}

# A repository-specific pool prevents this service from sharing trust state
# with decide-web while keeping the same keyless GitHub Actions model.
resource "google_iam_workload_identity_pool" "github_actions" {
  workload_identity_pool_id = "rope-ladder-web"
  display_name              = "rope-ladder-web GitHub Actions"
  description               = "Keyless GitHub Actions identities for rope-ladder-web"
}

resource "google_iam_workload_identity_pool_provider" "github_oidc" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC (rope-ladder-web)"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_condition = "assertion.repository == \"golbi-ai/rope-ladder-web\""

  attribute_mapping = {
    "google.subject"         = "assertion.sub"
    "attribute.repository"   = "assertion.repository"
    "attribute.ref"          = "assertion.ref"
    "attribute.repo_ref"     = "assertion.repository + \"@\" + assertion.ref"
    "attribute.workflow_ref" = "assertion.job_workflow_ref"
  }
}
