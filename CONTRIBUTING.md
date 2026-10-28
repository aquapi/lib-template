# Setup package
```sh
node scripts/src/setup.mts # setup package.json
upm i package-name@link:dist # install all packages, link package for testing

# predefined scripts 
node --run fmt # format with oxfmt
node --run test # run test with node test runner
```

Configurations are in [./scripts/config.mts](./scripts/config.mts).
