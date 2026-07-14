# rope-ladder-web GCP deployment

This is the `rpldr.golbi.ai` deployment in the same shared GCP project and with the same separation of duties as decide-web:

- OpenTofu owns Cloud Run configuration, Artifact Registry, identities, and domain mapping.
- GitHub Actions owns immutable image revisions and traffic promotion.
- GitHub Actions authenticates through repository-scoped Workload Identity Federation; no service-account keys are created.

## DNS record to add

Before applying the domain mapping, add this record in the DNS zone for `golbi.ai`:

| Type | Host/name | Target | TTL |
| --- | --- | --- | --- |
| `CNAME` | `rpldr` | `ghs.googlehosted.com.` | 300 (or your provider default) |

That is `rpldr.golbi.ai` → `ghs.googlehosted.com.`. Do not add an A/AAAA record for the same host. After DNS propagation, Google will provision the managed TLS certificate. Domain verification is expected to be available in the shared project; if Cloud Run reports that it is not, complete the verification prompt it returns before retrying.

## One-time bootstrap

The backend bucket `the-bird-499021-m8-tofu-state` already exists and is deliberately unmanaged. From an owner-authorized workstation:

```bash
gcloud auth application-default login
gcloud config set project the-bird-499021-m8

gcloud iam service-accounts create rope-ladder-web-tofu-apply \
  --display-name="rope-ladder-web infra apply"

for role in run.admin artifactregistry.admin iam.serviceAccountAdmin \
  iam.workloadIdentityPoolAdmin serviceusage.serviceUsageAdmin storage.admin \
  resourcemanager.projectIamAdmin iam.securityReviewer; do
  gcloud projects add-iam-policy-binding the-bird-499021-m8 \
    --member="serviceAccount:rope-ladder-web-tofu-apply@the-bird-499021-m8.iam.gserviceaccount.com" \
    --role="roles/$role" --condition=None
done

cd infra/gcp
cp terraform.tfvars.example terraform.tfvars
tofu init
tofu plan
tofu apply
```

The bootstrap identity is data-only in Terraform so a workflow cannot remove its own administrative identity. It is assumable only from the reviewed `main` branch infrastructure workflow after the first apply establishes the WIF binding.

## Routine delivery

Merges to `main` run the infrastructure apply lane, then the deployment lane builds an immutable commit-SHA image, deploys it with no production traffic, checks `/health`, and promotes it only after that check succeeds. Roll back by pointing Cloud Run traffic at the previous revision, then revert the offending commit.
