function readPackage(pkg, context) {
  if (pkg.name === "ssh2") {
    if (pkg.optionalDependencies && pkg.optionalDependencies["cpu-features"]) {
      delete pkg.optionalDependencies["cpu-features"];
      context.log("Removed cpu-features from ssh2 optionalDependencies");
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
