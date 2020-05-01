#!/usr/bin/env bash

ansi --green "Importing tags from: ../models/tags.json"

mongoimport --db=wbag --collection=tags --jsonArray ../models/tags.json

exit 0
