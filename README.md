# consul-to-configmap

A very crude way to push values from Consul into ConfigMaps.

Given an env variable CONSUL_PREFIX:

Consul kvs under <CONSUL_PREFIX> having the key format of `namespace/name` are pushed as ConfigMaps having `name` in namespace `namespace`.

Example kv structure:

CONSUL_PREFIX="myorg/myenv"

`myorg/myenv/default/app1`

`myorg/myenv/namespace2/app2`

Things to know:

* it begins with `consul watch` under the hood. The user is responsible for setting up the env vars for consul client.

* if `namespace` does not exists in k8s, the key is skipped (but will be repeated with future triggers)

* consul kv data is put into the ConfigMap under key `data`. Binaries are not supported.
