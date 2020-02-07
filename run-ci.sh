#!/bin/bash
set -ev

npm run test
npm run coverage
npm run lint

if [ "${CI}" = "true" ]; then
	cat ./reports/lcov.info | nyc coveralls
fi

