#!/bin/bash
set -ev

npm run test
npm run coverage
npm run lint

if [ "${CI}" = "true" ]; then
	cat ./coverage/lcov.info | nyc coveralls
fi

