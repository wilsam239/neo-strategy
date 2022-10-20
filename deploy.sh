#!/bin/bash

# Take the search string
search=".*\;$"
replace="deployed: $(date +%s)};"

sed -i '' "s/$search/$replace/gi" "src/environments/environment.prod.ts"