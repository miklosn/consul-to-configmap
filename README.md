# consul-to-configmap

A very crude way to push values from Consul into ConfigMaps.

Given an env variable CONSUL_PREFIX:

Consul kvs under <CONSUL_PREFIX> having the key format of `namespace/name` are pushed as ConfigMaps having `name` in namespace `namespace`.

Example kv structure:

CONSUL_PREFIX="myorg/myenv"
`myorg/myenv/default/app1`
`myorg/myenv/namespace2/app2`

