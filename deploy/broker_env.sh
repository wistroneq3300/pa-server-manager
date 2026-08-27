export SPX_KVM_TARGETS='[{"server_id":"bmc-internal-a","bmc_subdomain":"bmc-bmc-internal-a.kvm.lab.example.internal","upstream_ip":"INTERNAL_IP_2","kvm_operator_cred_name":"spx:bmc-internal-a:kvm-operator"}]'
export SPX_SECRET_FILE=/etc/portal/secrets/spx-bmc-credentials.age
export SPX_IDENTITY_FILE=/etc/portal/secrets/spx-bmc-identity.txt
export SPX_REGISTRY_DB=/tmp/spx-broker-registry.db
export SPX_AUDIT_LOG=/tmp/spx-broker-audit.log
export SPX_PORTAL_AUTH=noauth
