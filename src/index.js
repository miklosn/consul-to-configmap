var fs = require("fs");
const k8s = require("@kubernetes/client-node");
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const libk8s = require("./lib/k8s");

const prefix = process.env.CONSUL_PREFIX;

const log = require("./lib/log").child({module: "main"});

log.info("Using prefix", { prefix });

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function main() {
  try {
    log.info("Reconciling...");
    var stdinBuffer = fs.readFileSync(0); // STDIN_FILENO = 0
    const obj = JSON.parse(stdinBuffer);
    log.debug('%o',obj);
    await asyncForEach(obj, async (item) => {
      const replace = "^" + prefix;
      var re = new RegExp(replace, "g");
      const key = item.Key.replace(re, "");
      try {
        const regexp = /^([a-z][a-z0-9\-]+)\/([a-z][a-z0-9\-]+)$/;
        const result = key.match(regexp);
        if (!result) {
          log.error("Key is in wrong format, ignoring", key);
        } else {
          const namespace = result[1];
          const configmap = result[2];
          await reconcile(namespace, configmap, item);
        }
      } catch (error) {
        log.error(error);
      }
    });
  } catch (err) {
    alert(err);
  }
}

const reconcile = async (namespace, configmap, data) => {
  log.debug("Reconciling", { namespace, configmap });
  try {
    const namespaceExists = await libk8s.nameSpaceExists(namespace);

    if (!namespaceExists) {
      log.debug("Namespace doesn't exist, ignoring");
      return;
    }

    const configMap = await libk8s.getConfigMap(namespace, configmap);

    if (configMap == null) {
      log.debug('Configmap doesn\'t exist');
      const cm = libk8s.createConfigMap(namespace, configmap, data);
      await libk8s.saveNewConfigmap(namespace, cm);
      log.info("%s/%s created", namespace, configmap);
      return;
    }

    const storedVersion = configMap.metadata.annotations["consul-to-configmap"];
    const currentVersion = data.ModifyIndex.toString();

    if (storedVersion === currentVersion) {
      log.debug("Version is the same, skipping")
      return;
    }

    let buff = Buffer.from(data.Value, 'base64'); // TODO: data is empty
    let text = buff.toString('ascii');
    configMap.data = { data: text };
    configMap.metadata.annotations["consul-to-configmap"] = currentVersion;
    await libk8s.patchConfigMap(namespace, configMap);
    log.info("%s/%s updated", namespace, configmap);
  } catch (error) {
    log.error(error);
  }
};

main();

