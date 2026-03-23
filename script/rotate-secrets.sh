#!/usr/bin/env bash
# required programs: kubectl
#
# Usage: ./script.sh [--dry-run]

NAMESPACE='elektra'
SECRETS=(elektra-pguser-backup elektra-pguser-elektra elektra-pguser-metrics)
OWNER_DEPLOYMENT='elektra-postgresql'
USER_DEPLOYMENTS=(elektra elektra-pgbackup session-pruning)

# Check for dry-run flag
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo ">> DRY-RUN MODE - No changes will be made"
  echo ""
fi

# Safety check if not in dry-run mode
if [[ "$DRY_RUN" == false ]]; then
  echo "⚠️  WARNING: This will rotate secrets for elektra-postgresql!"
  echo "     and will cause downtime for the following deployments:"
  for DEPLOYMENT in "${USER_DEPLOYMENTS[@]}"; do
    echo "   - $DEPLOYMENT"
  done
  echo ""
  read -p "Have you tested this with --dry-run first? (yes/no): " tested
  if [[ "$tested" != "yes" ]]; then
    echo "Please run with --dry-run first to verify the changes."
    exit 1
  fi
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " confirm
  if [[ "$confirm" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
  echo ""
fi

# Helper function to run kubectl commands
run_kubectl() {
  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] kubectl $@"
  else
    kubectl "$@"
  fi
}

# Save original replica counts BEFORE scaling down
echo ">> Saving original replica counts..."
declare -A ORIGINAL_REPLICAS
for DEPLOYMENT in "${USER_DEPLOYMENTS[@]}"; do
  REPLICAS="$(kubectl -n "${NAMESPACE}" get deployment "${DEPLOYMENT}" -o jsonpath='{.spec.replicas}')"
  ORIGINAL_REPLICAS[$DEPLOYMENT]=$REPLICAS
  echo "   deployment/$DEPLOYMENT: $REPLICAS replicas"
done

# Start downtime measurement
START_TIME=$(date +%s)

# Scale down all relevant deployments
echo ">> Scaling down deployments..."
run_kubectl -n "$NAMESPACE" scale --replicas=0 deployment "$OWNER_DEPLOYMENT" "${USER_DEPLOYMENTS[@]}"

# Delete secrets
echo ">> Deleting secrets..."
run_kubectl -n "$NAMESPACE" delete secret "${SECRETS[@]}"

# Bring up owner deployment to make it recreate the secrets
echo ">> Scaling up owner deployment..."
run_kubectl -n "$NAMESPACE" scale --replicas=1 deployment "$OWNER_DEPLOYMENT"

# Wait for owner to recreate the secret
echo ">> Waiting for owner deployment to be ready..."
if [[ "$DRY_RUN" == false ]]; then
  kubectl -n "$NAMESPACE" rollout status deployment "$OWNER_DEPLOYMENT"
else
  echo "[DRY-RUN] kubectl -n $NAMESPACE rollout status deployment $OWNER_DEPLOYMENT"
fi

# Scale up user deployments to their original replica counts
echo ">> Scaling up user deployments..."
for DEPLOYMENT in "${USER_DEPLOYMENTS[@]}"; do
  REPLICAS="${ORIGINAL_REPLICAS[$DEPLOYMENT]}"
  if [[ "${REPLICAS:-0}" -gt 0 ]]; then
    echo ">> Scaling deployment/$DEPLOYMENT to $REPLICAS replicas"
    run_kubectl -n "$NAMESPACE" scale "--replicas=$REPLICAS" deployment "$DEPLOYMENT"
  else
    echo "WARNING: deployment/$DEPLOYMENT had 0 replicas, skipping"
  fi
done

# Wait for at least one pod of elektra deployment to be ready
echo ">> Waiting for elektra deployment to have at least one ready pod..."
if [[ "$DRY_RUN" == false ]]; then
  kubectl -n "$NAMESPACE" wait --for=condition=available --timeout=300s deployment/elektra
  
  # End downtime measurement
  END_TIME=$(date +%s)
  DOWNTIME=$((END_TIME - START_TIME))
  
  echo ""
  echo ">> Done!"
  echo "⏱️  Total downtime: ${DOWNTIME} seconds"
else
  echo "[DRY-RUN] kubectl -n $NAMESPACE wait --for=condition=available --timeout=300s deployment/elektra"
  echo ""
  echo ">> Done!"
  echo "⏱️  Total downtime: [DRY-RUN - not measured]"
fi