# Notes

## Features

-[x] Add tool to run markdown on html and save in the database.
-[x] Markdown version created when baged.
-[x] Markdown used instead of content (html)
-[x] Editing of html content.
-[] Simple search (by titles using mongo query)
-[] Other ways to search??
-[] Annotation of content. (almost there, bug with loading from server)
-[] Add Tags Editor/Manager and summary/count
-[] Notes section with some simple hierarchy (like directory tree).
-[] Backend service to process jobs (links sent to a list via SQS or similar) save and archive links (the `processor` directory is the starting point for this).

## Fixes

-[x] Move approx. reading time from header to footer in cards view.
-[x] Fix header in details view to be spaced better and tags as last with `uk-width-expand`.
-[x] Add link to HOME to details view.
-[x] Change link to source page in details to only show the link icon.
-[x] Add helper to regex for links and add `target="_blank">` to all.
-[x] Fix `cacheImages.json` to update `preview_pic` to null if error downloading image.
-[x] Star on details view not working.
-[x] Archive on details view not working.
-[x] Archive of article not working.
-[x] Starring of article not working.
-[x] Removing tag does not work.

## Refactoring

-[] Change to fully REST based with front-end in Vue.js (the `client` directory is the starting point for this).
