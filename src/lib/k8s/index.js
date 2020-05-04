
const k8s = require("@kubernetes/client-node");
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);

const log = require("../log").child({module: "libk8s"});

const nameSpaceExists = async (namespace) => {
  log.debug("nameSpaceExists()", namespace);
  try {
    const ns = await coreV1.readNamespace(namespace);
    return true;
  } catch (error) {
    if (error.statusCode == 404) {
      log.debug("api returned 404");
      return false;
    } else {
      log.error("error");
      throw error;
    }
  }
};

const getConfigMap = async (namespace, configmap) => {
  log.debug("getConfigMap", { namespace, configmap });
  try {
    const cm = (await coreV1.readNamespacedConfigMap(configmap, namespace)).body;
    log.debug(cm);
    return cm;
  } catch (error) {
    if (error.statusCode == 404) {
      log.debug("api returned 404");
      return null;
    } else {
      throw error;
    }
  }
};

const createConfigMap = (namespace, configmap, data) => {
  log.debug("createConfigMap", { namespace, configmap, data });
  let buff = Buffer.from(data.Value, 'base64');
  let text = buff.toString('ascii');
  const cm = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      annotations: {
        'consul-to-configmap': data.ModifyIndex.toString()
      },
      name: configmap
    },
    data: {
      data: text
    }
  }
  return cm;
};

const saveNewConfigmap = async (namespace, cm) => {
  log.debug("saveNewConfigmap", { cm });
  try {
    const result = await coreV1.createNamespacedConfigMap(namespace, cm);
  }
  catch (error) {
    log.error(error);
    log.error(error.response.body);
    throw error;
  }
}

const patchConfigMap = async (namespace, cm) => {
  log.debug("patchConfigMap", { cm });
  try {
    const headers = { 'content-type': 'application/strategic-merge-patch+json' }
    const result = await coreV1.patchNamespacedConfigMap(cm.metadata.name, namespace, cm, undefined, undefined, undefined, undefined, { headers });
    return;
  }
  catch (error) {
    console.log(error);
    log.error(error);
    log.error(error.response.body);
    throw error;
  }
}

module.exports = {
  nameSpaceExists,
  getConfigMap,
  createConfigMap,
  saveNewConfigmap,
  patchConfigMap
};
